const jwt = require('jsonwebtoken');
const db = require('../config/db');
const cache = require('../config/cache');
const { sendEmailOTP } = require('../config/email');
const { sendOTP: sendPhoneOTP } = require('../config/twilio');

// Helper to determine if input is email
const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

// Helper to mask email for UI display
const maskEmail = (em) => {
    if (!em) return '';
    const [name, domain] = em.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name.slice(-1)}@${domain}`;
};

// Helper to mask phone for UI display
const maskPhone = (ph) => {
    if (!ph) return '';
    if (ph.length <= 4) return ph;
    return ph.slice(0, 3) + ' ' + '*'.repeat(Math.max(2, ph.length - 7)) + ' ' + ph.slice(-4);
};

/**
 * Request Dual OTP (Email + Mobile) for Admin Verification
 */
const requestDualOtp = async (req, res) => {
    let { identifier } = req.body;

    if (!identifier && req.user) {
        identifier = req.user.email || req.user.phone;
    }

    if (!identifier || typeof identifier !== 'string') {
        return res.status(400).json({ error: 'Please provide an administrator email or phone number.' });
    }

    identifier = identifier.trim();
    const type = isEmail(identifier) ? 'email' : 'phone';
    let query, params;

    if (type === 'email') {
        query = 'SELECT id, email, phone, role, status FROM users WHERE LOWER(email) = LOWER($1)';
        params = [identifier];
    } else {
        let phone = identifier;
        if (!phone.startsWith('+')) phone = '+91' + phone;
        query = 'SELECT id, email, phone, role, status FROM users WHERE phone = $1 OR phone = $2';
        params = [phone, identifier];
    }

    try {
        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No administrator account found with this identifier.' });
        }

        const user = result.rows[0];

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Account does not have administrator privileges.' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ error: 'Admin account is currently suspended or inactive.' });
        }

        if (!user.email || !user.phone) {
            return res.status(400).json({
                error: `Admin account (${user.email || user.phone}) must have BOTH an email and mobile number registered for 2-Factor Authentication. Please run "node set_admin.js <email> <phone>" on server.`,
                missingContact: !user.email ? 'email' : 'phone'
            });
        }

        // Generate two distinct 6-digit OTPs
        const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        let mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
        while (mobileOtp === emailOtp) {
            mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
        }

        // Save OTPs in cache_store for 5 minutes (300 seconds)
        await cache.setEx(`admin_email_otp:${user.id}`, 300, emailOtp);
        await cache.setEx(`admin_mobile_otp:${user.id}`, 300, mobileOtp);

        // Server terminal log for debug / admin visibility on Hostinger
        console.log(`\n======================================================`);
        console.log(`🔐 [ADMIN 2FA SECURITY GATEWAY]`);
        console.log(`Admin User ID: ${user.id} | Email: ${user.email} | Mobile: ${user.phone}`);
        console.log(`✉️  EMAIL OTP:  ${emailOtp} (valid 5 min)`);
        console.log(`📱 MOBILE OTP: ${mobileOtp} (valid 5 min)`);
        console.log(`======================================================\n`);

        // Send Email OTP
        let emailDelivered = false;
        try {
            await sendEmailOTP(user.email, emailOtp);
            emailDelivered = true;
            console.log(`✅ Admin 2FA Email OTP sent to ${user.email}`);
        } catch (emailErr) {
            console.error(`⚠️ Failed to deliver Admin 2FA Email to ${user.email}:`, emailErr.message);
        }

        // Send Mobile OTP
        let phoneDelivered = false;
        try {
            await sendPhoneOTP(user.phone, mobileOtp);
            phoneDelivered = true;
            console.log(`✅ Admin 2FA Mobile OTP sent to ${user.phone}`);
        } catch (phoneErr) {
            console.error(`⚠️ Failed to deliver Admin 2FA SMS to ${user.phone}:`, phoneErr.message);
        }

        res.json({
            message: 'Dual verification codes sent to your registered email and mobile number.',
            userId: user.id,
            maskedEmail: maskEmail(user.email),
            maskedPhone: maskPhone(user.phone),
            emailDelivered,
            phoneDelivered
        });

    } catch (error) {
        console.error('Admin request dual OTP error:', error);
        res.status(500).json({ error: 'Server error processing admin verification request.' });
    }
};

/**
 * Verify Dual OTP (Email + Mobile) and Issue Elevated Admin Token
 */
const verifyDualOtp = async (req, res) => {
    const rawUserId = req.body.userId;
    const emailOtp = req.body.emailOtp;
    const mobileOtp = req.body.mobileOtp;

    const userId = Number.isInteger(rawUserId) ? rawUserId : parseInt(rawUserId, 10);

    if (!userId || !emailOtp || !mobileOtp) {
        return res.status(400).json({ error: 'User ID, Email OTP, and Mobile OTP are all required.' });
    }

    try {
        const cachedEmailOtp = await cache.get(`admin_email_otp:${userId}`);
        const cachedMobileOtp = await cache.get(`admin_mobile_otp:${userId}`);

        if (!cachedEmailOtp || !cachedMobileOtp) {
            return res.status(401).json({ error: 'Verification codes have expired. Please request new codes.' });
        }

        const cleanEmailOtp = String(emailOtp).trim();
        const cleanMobileOtp = String(mobileOtp).trim();

        const isEmailMatch = cachedEmailOtp === cleanEmailOtp;
        const isMobileMatch = cachedMobileOtp === cleanMobileOtp;

        if (!isEmailMatch && !isMobileMatch) {
            return res.status(401).json({ error: 'Both Email and Mobile verification codes are incorrect.' });
        }
        if (!isEmailMatch) {
            return res.status(401).json({ error: 'Email verification code is incorrect.' });
        }
        if (!isMobileMatch) {
            return res.status(401).json({ error: 'Mobile verification code is incorrect.' });
        }

        // Both verified! Delete from cache
        await cache.del(`admin_email_otp:${userId}`);
        await cache.del(`admin_mobile_otp:${userId}`);

        // Fetch admin user
        const result = await db.query(
            `SELECT u.id, u.email, u.phone, u.role, u.status, p.first_name, p.last_name
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1 AND u.role = 'admin'`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Admin account not found or role has been modified.' });
        }

        const user = result.rows[0];

        // Track IP in login history
        let rawIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'Unknown';
        if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') rawIp = '127.0.0.1 (Localhost)';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        await db.query(
            'INSERT INTO login_history (user_id, ip_address, user_agent) VALUES ($1, $2, $3)',
            [user.id, rawIp, `[ADMIN 2FA SECURE] ${userAgent}`]
        );

        // Issue elevated Admin JWT with admin2Fa: true
        const adminToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role,
                admin2Fa: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Admin 2FA dual verification successful. Access granted.',
            token: adminToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });

    } catch (error) {
        console.error('Admin verify dual OTP error:', error);
        res.status(500).json({ error: 'Server error during admin verification.' });
    }
};

/**
 * Verify current Admin 2FA Session Status
 */
const checkAdminSession = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' || !req.user.admin2Fa) {
            return res.status(403).json({ valid: false, error: 'Admin 2FA session expired or not verified.' });
        }
        res.json({
            valid: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ valid: false, error: 'Error checking admin session' });
    }
};

module.exports = {
    requestDualOtp,
    verifyDualOtp,
    checkAdminSession
};
