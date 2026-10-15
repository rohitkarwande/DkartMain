const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const cache = require('../../config/cache');
const { sendOTP: sendPhoneOTP } = require('../../config/twilio');
const { sendEmailOTP } = require('../../config/email');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

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

class AuthService {
    /**
     * Helper to validate email format
     */
    isEmail(str) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    /**
     * Formats and sanitizes user identifier (email or phone)
     */
    sanitizeIdentifier(rawIdentifier) {
        if (!rawIdentifier) return null;
        let identifier = rawIdentifier.trim();
        const type = this.isEmail(identifier) ? 'email' : 'phone';

        if (type === 'email') {
            identifier = identifier.toLowerCase();
        } else if (type === 'phone' && !identifier.startsWith('+')) {
            // Automatically prepend +91 for Indian phone numbers if missing
            identifier = '+91' + identifier;
        }

        return { identifier, type };
    }

    /**
     * Signs a JWT token with standard payload
     */
    generateToken(payload, expiresIn = '24h') {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    }

    /**
     * Verifies a JWT
     */
    verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    /**
     * Fetches current user profile from DB by ID for auth verification
     */
    async getUserById(userId) {
        const result = await db.query(
            'SELECT id, email, phone, role, is_verified, status FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Core authentication pipeline used by middleware
     * Extracts Bearer token, verifies signature, and ensures user is active
     */
    async authenticateFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const err = new Error('No token provided');
            err.statusCode = 401;
            throw err;
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = this.verifyToken(token);
        } catch (error) {
            const err = new Error('Invalid or expired token');
            err.statusCode = 401;
            throw err;
        }

        const user = await this.getUserById(decoded.id);
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 401;
            throw err;
        }

        if (user.status === 'Suspended') {
            const err = new Error('Account suspended. Please contact support.');
            err.statusCode = 403;
            throw err;
        }

        return {
            ...decoded,
            ...user,
            admin2Fa: decoded.admin2Fa === true
        };
    }

    /**
     * Generates and dispatches OTP via SMS or Email
     */
    async sendOtp(identifier, action = 'login') {
        const sanitized = this.sanitizeIdentifier(identifier);
        if (!sanitized) {
            const err = new Error('Please provide an email or phone number');
            err.statusCode = 400;
            throw err;
        }

        const { identifier: idf, type } = sanitized;

        // Check if user exists
        const userRes = await db.query(`SELECT id FROM users WHERE ${type} = $1`, [idf]);
        let userId;

        if (action === 'login') {
            if (userRes.rows.length === 0) {
                const err = new Error('User not registered, please register first.');
                err.statusCode = 400;
                throw err;
            }
            userId = userRes.rows[0].id;
        } else if (action === 'register') {
            if (userRes.rows.length > 0) {
                const err = new Error('User already registered, please login.');
                err.statusCode = 400;
                throw err;
            }
            const insertResult = await db.query(
                `INSERT INTO users (${type}) VALUES ($1) RETURNING id`,
                [idf]
            );
            userId = insertResult.rows[0].id;
        } else {
            // Fallback for legacy
            if (userRes.rows.length === 0) {
                const insertResult = await db.query(
                    `INSERT INTO users (${type}) VALUES ($1) RETURNING id`,
                    [idf]
                );
                userId = insertResult.rows[0].id;
            } else {
                userId = userRes.rows[0].id;
            }
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in cache for 5 minutes (300 seconds)
        await cache.setEx(`otp:${userId}`, 300, otp);
        console.log(`[OTP DEBUG] Generated OTP for ${idf} (User ID: ${userId}): ${otp}`);

        // Dispatch via twilio or nodemailer
        if (type === 'email') {
            try {
                await sendEmailOTP(idf, otp);
                console.log(`✅ OTP sent to email: ${idf}`);
            } catch (emailError) {
                console.error(`⚠️ Failed to deliver OTP email to ${idf}:`, emailError.message);
                console.log(`🔑 FALLBACK OTP for ${idf}: ${otp} (valid 5 min)`);
            }
        } else {
            await sendPhoneOTP(idf, otp);
        }

        return { message: `OTP sent to your ${type}`, userId, type };
    }

    /**
     * Verifies user OTP, performs IP & blacklist checks, logs login history, and sends notifications
     */
    async verifyAuthOtp({ rawUserId, otp, ipAddress, userAgent, io }) {
        const userId = Number.isInteger(rawUserId) ? rawUserId : parseInt(rawUserId, 10);

        if (!userId || !otp) {
            const err = new Error('User ID and OTP are required');
            err.statusCode = 400;
            throw err;
        }

        // 1. Check IP Blacklist
        const blacklistCheck = await db.query('SELECT reason FROM ip_blacklist WHERE ip_address = $1', [ipAddress]);
        if (blacklistCheck.rows.length > 0) {
            const err = new Error('Access denied from this IP address.');
            err.statusCode = 403;
            throw err;
        }

        const cachedOtp = await cache.get(`otp:${userId}`);
        if (!cachedOtp || cachedOtp !== otp) {
            const err = new Error('Invalid or expired OTP');
            err.statusCode = 401;
            throw err;
        }

        // OTP matches, clear it from cache
        await cache.del(`otp:${userId}`);

        // Check if user was already verified before we update
        const previousState = await db.query('SELECT is_verified FROM users WHERE id = $1', [userId]);
        const wasVerified = previousState.rows[0]?.is_verified;

        // Mark user as verified
        await db.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [userId]);

        // Fetch user to generate token and return profile state
        const result = await db.query(
            `SELECT u.id, u.email, u.phone, u.role, p.profession, p.location
             FROM users u 
             LEFT JOIN user_profiles p ON u.id = p.user_id 
             WHERE u.id = $1`,
            [userId]
        );
        const user = result.rows[0];

        if (!user) {
            console.error('OTP verification failed: user not found', { userId });
            const err = new Error('Server error during OTP verification');
            err.statusCode = 500;
            throw err;
        }

        // Trigger admin notification if new user just verified
        if (!wasVerified) {
            try {
                const { notifyAdmins } = require('../notifications/adminNotificationService');
                notifyAdmins(io, 'NEW_USER', `A new user has registered with ${user.email || user.phone}`, user.id);

                const { emailNewRegistration } = require('../notifications/emailService');
                emailNewRegistration(user.email || user.phone, user.id);
            } catch (notifErr) {
                console.error('Error triggering registration notifications:', notifErr.message);
            }
        }

        // IP Tracking & Alerts
        const ipCheck = await db.query('SELECT id FROM login_history WHERE user_id = $1 AND ip_address = $2 LIMIT 1', [userId, ipAddress]);
        const isNewIp = ipCheck.rows.length === 0;

        await db.query('INSERT INTO login_history (user_id, ip_address, user_agent) VALUES ($1, $2, $3)', [userId, ipAddress, userAgent]);

        // Send warning email if this is a new IP and the user already existed
        if (isNewIp && wasVerified && user.email) {
            try {
                const { emailNewLoginAlert } = require('../notifications/emailService');
                emailNewLoginAlert(user.email, ipAddress, userAgent).catch(err => console.error('Failed to send login alert:', err));
            } catch (emailErr) {
                console.error('Failed to trigger login alert email:', emailErr.message);
            }
        }

        const token = this.generateToken(
            { id: user.id, email: user.email, phone: user.phone, role: user.role },
            '24h'
        );

        return { message: 'Login successful', token, user };
    }

    /**
     * Authenticates with Google ID token or mocked test environment
     */
    async loginWithGoogle({ credential, mockEmail, mockName, isMock }) {
        let email = mockEmail;
        let name = mockName;

        if (googleClient && credential && !isMock) {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: googleClientId,
                });
                const payload = ticket.getPayload();
                email = payload.email;
                name = payload.name;
            } catch (verifyError) {
                console.error('Google ID Token verification failed:', verifyError.message);
                const err = new Error('Invalid or expired Google identity token');
                err.statusCode = 401;
                throw err;
            }
        } else {
            console.log(`[Google Auth] Simulated login for ${email} (Name: ${name})`);
        }

        if (!email) {
            const err = new Error('Email is required for Google Sign-In');
            err.statusCode = 400;
            throw err;
        }

        const lowercaseEmail = email.toLowerCase().trim();

        // 1. Check if user already exists
        let result = await db.query(
            'SELECT id, email, phone, role, is_verified FROM users WHERE email = $1',
            [lowercaseEmail]
        );
        let user;

        if (result.rows.length === 0) {
            // 2. Create new user
            const insertResult = await db.query(
                "INSERT INTO users (email, role, is_verified, status) VALUES ($1, 'user', TRUE, 'Active') RETURNING id, email, phone, role, is_verified",
                [lowercaseEmail]
            );
            user = insertResult.rows[0];

            if (name) {
                const spaceIndex = name.indexOf(' ');
                const firstName = spaceIndex !== -1 ? name.substring(0, spaceIndex) : name;
                const lastName = spaceIndex !== -1 ? name.substring(spaceIndex + 1) : '';

                await db.query(
                    'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING',
                    [user.id, firstName, lastName]
                );
            }
        } else {
            user = result.rows[0];
            await db.query("UPDATE users SET is_verified = TRUE, status = 'Active' WHERE id = $1", [user.id]);
        }

        // 3. Generate JWT Token
        const token = this.generateToken(
            { id: user.id, email: user.email, phone: user.phone, role: user.role },
            '24h'
        );

        // 4. Fetch full user profile
        const profileRes = await db.query(
            `SELECT u.id, u.email, u.phone, u.role, p.first_name, p.last_name, p.profession, p.location
             FROM users u 
             LEFT JOIN user_profiles p ON u.id = p.user_id 
             WHERE u.id = $1`,
            [user.id]
        );

        return {
            message: 'Google login successful',
            token,
            user: profileRes.rows[0]
        };
    }

    /**
     * Request Dual OTP for Admin 2FA
     */
    async requestAdminDualOtp(identifier) {
        if (!identifier || typeof identifier !== 'string') {
            const err = new Error('Please provide an administrator email or phone number.');
            err.statusCode = 400;
            throw err;
        }

        const idf = identifier.trim();
        const type = this.isEmail(idf) ? 'email' : 'phone';
        let query, params;

        if (type === 'email') {
            query = 'SELECT id, email, phone, role, status FROM users WHERE LOWER(email) = LOWER($1)';
            params = [idf];
        } else {
            let phone = idf;
            if (!phone.startsWith('+')) phone = '+91' + phone;
            query = 'SELECT id, email, phone, role, status FROM users WHERE phone = $1 OR phone = $2';
            params = [phone, idf];
        }

        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            const err = new Error('No administrator account found with this identifier.');
            err.statusCode = 404;
            throw err;
        }

        const user = result.rows[0];

        if (user.role !== 'admin') {
            const err = new Error('Access denied. Account does not have administrator privileges.');
            err.statusCode = 403;
            throw err;
        }

        if (user.status !== 'Active') {
            const err = new Error('Admin account is currently suspended or inactive.');
            err.statusCode = 403;
            throw err;
        }

        if (!user.email || !user.phone) {
            const err = new Error(`Admin account (${user.email || user.phone}) must have BOTH an email and mobile number registered for 2-Factor Authentication.`);
            err.statusCode = 400;
            err.missingContact = !user.email ? 'email' : 'phone';
            throw err;
        }

        // Generate distinct 6-digit OTPs
        const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        let mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
        while (mobileOtp === emailOtp) {
            mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
        }

        // Save OTPs in cache for 5 minutes
        await cache.setEx(`admin_email_otp:${user.id}`, 300, emailOtp);
        await cache.setEx(`admin_mobile_otp:${user.id}`, 300, mobileOtp);

        console.log(`\n======================================================`);
        console.log(`🔐 [ADMIN 2FA SECURITY GATEWAY]`);
        console.log(`Admin User ID: ${user.id} | Email: ${user.email} | Mobile: ${user.phone}`);
        console.log(`✉️  EMAIL OTP:  ${emailOtp} (valid 5 min)`);
        console.log(`📱 MOBILE OTP: ${mobileOtp} (valid 5 min)`);
        console.log(`======================================================\n`);

        let emailDelivered = false;
        try {
            await sendEmailOTP(user.email, emailOtp);
            emailDelivered = true;
            console.log(`✅ Admin 2FA Email OTP sent to ${user.email}`);
        } catch (emailErr) {
            console.error(`⚠️ Failed to deliver Admin 2FA Email to ${user.email}:`, emailErr.message);
        }

        let phoneDelivered = false;
        try {
            await sendPhoneOTP(user.phone, mobileOtp);
            phoneDelivered = true;
            console.log(`✅ Admin 2FA Mobile OTP sent to ${user.phone}`);
        } catch (phoneErr) {
            console.error(`⚠️ Failed to deliver Admin 2FA SMS to ${user.phone}:`, phoneErr.message);
        }

        return {
            message: 'Dual verification codes sent to your registered email and mobile number.',
            userId: user.id,
            maskedEmail: maskEmail(user.email),
            maskedPhone: maskPhone(user.phone),
            emailDelivered,
            phoneDelivered
        };
    }

    /**
     * Verifies Admin Dual OTP and returns elevated Admin token
     */
    async verifyAdminDualOtp({ rawUserId, emailOtp, mobileOtp, ipAddress, userAgent }) {
        const userId = Number.isInteger(rawUserId) ? rawUserId : parseInt(rawUserId, 10);

        if (!userId || !emailOtp || !mobileOtp) {
            const err = new Error('User ID, Email OTP, and Mobile OTP are all required.');
            err.statusCode = 400;
            throw err;
        }

        const cachedEmailOtp = await cache.get(`admin_email_otp:${userId}`);
        const cachedMobileOtp = await cache.get(`admin_mobile_otp:${userId}`);

        if (!cachedEmailOtp || !cachedMobileOtp) {
            const err = new Error('Verification codes have expired. Please request new codes.');
            err.statusCode = 401;
            throw err;
        }

        const cleanEmailOtp = String(emailOtp).trim();
        const cleanMobileOtp = String(mobileOtp).trim();

        const isEmailMatch = cachedEmailOtp === cleanEmailOtp;
        const isMobileMatch = cachedMobileOtp === cleanMobileOtp;

        if (!isEmailMatch && !isMobileMatch) {
            const err = new Error('Both Email and Mobile verification codes are incorrect.');
            err.statusCode = 401;
            throw err;
        }
        if (!isEmailMatch) {
            const err = new Error('Email verification code is incorrect.');
            err.statusCode = 401;
            throw err;
        }
        if (!isMobileMatch) {
            const err = new Error('Mobile verification code is incorrect.');
            err.statusCode = 401;
            throw err;
        }

        // Clear cache
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
            const err = new Error('Admin account not found or role has been modified.');
            err.statusCode = 404;
            throw err;
        }

        const user = result.rows[0];

        // Track IP in login history
        await db.query(
            'INSERT INTO login_history (user_id, ip_address, user_agent) VALUES ($1, $2, $3)',
            [user.id, ipAddress, `[ADMIN 2FA SECURE] ${userAgent}`]
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

        return {
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
        };
    }
}

module.exports = new AuthService();
