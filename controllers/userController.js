const db = require('../config/db');

const getProfile = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.id, u.email, u.phone, u.is_verified, u.created_at, u.role,
                    p.first_name, p.last_name, p.company_name, p.avatar_url, p.bio, p.age, p.profession
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { first_name, last_name, company_name, avatar_url, bio, age, profession } = req.body;
        
        const result = await db.query(
            `INSERT INTO user_profiles (user_id, first_name, last_name, company_name, avatar_url, bio, age, profession)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (user_id) DO UPDATE 
             SET first_name = EXCLUDED.first_name,
                 last_name = EXCLUDED.last_name,
                 company_name = EXCLUDED.company_name,
                 avatar_url = EXCLUDED.avatar_url,
                 bio = EXCLUDED.bio,
                 age = EXCLUDED.age,
                 profession = EXCLUDED.profession,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.user.id, first_name, last_name, company_name, avatar_url, bio, age, profession]
        );
        res.json({ message: 'Profile updated', profile: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating profile' });
    }
};

const submitKyc = async (req, res) => {
    try {
        const { document_type, document_url } = req.body;
        
        if (!document_type || !document_url) {
            return res.status(400).json({ error: 'document_type and document_url are required' });
        }

        const result = await db.query(
            `INSERT INTO kyc_documents (user_id, document_type, document_url)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO UPDATE
             SET document_type = EXCLUDED.document_type,
                 document_url = EXCLUDED.document_url,
                 status = 'Pending',
                 submitted_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.user.id, document_type, document_url]
        );

        res.json({ message: 'KYC submitted successfully', kyc: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error submitting KYC' });
    }
};

const becomeSeller = async (req, res) => {
    try {
        // In a real app, this might check KYC status before upgrading
        const result = await db.query(
            `UPDATE users SET role = 'seller' WHERE id = $1 RETURNING id, role`,
            [req.user.id]
        );
        
        res.json({ message: 'Successfully upgraded to seller', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error upgrading to seller' });
    }
};

const getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const postsRes = await db.query('SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1', [userId]);
        const inquiriesRes = await db.query('SELECT COUNT(*) FROM inquiries WHERE seller_id = $1 OR buyer_id = $1', [userId]);
        
        res.json({ 
            message: 'Welcome to Dashboard', 
            stats: { 
                totalPosts: parseInt(postsRes.rows[0].count, 10),
                totalInquiries: parseInt(inquiriesRes.rows[0].count, 10)
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching dashboard' });
    }
};

const { sendOTP: sendPhoneOTP } = require('../config/twilio');
const { sendEmailOTP } = require('../config/email');
const cache = require('../config/cache');

const addContact = async (req, res) => {
    try {
        const { identifier, type } = req.body; // type is 'email' or 'phone'
        if (!identifier || !type) return res.status(400).json({ error: 'identifier and type required' });

        // Check if already used
        const existing = await db.query(`SELECT id FROM users WHERE ${type} = $1`, [identifier]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'This contact is already registered to another account.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await cache.setEx(`contact-otp:${req.user.id}:${identifier}`, 300, otp);

        if (type === 'email') await sendEmailOTP(identifier, otp);
        else await sendPhoneOTP(identifier, otp);

        res.json({ message: `OTP sent to ${identifier}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending OTP' });
    }
};

const verifyContact = async (req, res) => {
    try {
        const { identifier, type, otp } = req.body;
        
        const cachedOtp = await cache.get(`contact-otp:${req.user.id}:${identifier}`);
        if (!cachedOtp || cachedOtp !== otp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        await cache.del(`contact-otp:${req.user.id}:${identifier}`);
        
        // Update user
        await db.query(`UPDATE users SET ${type} = $1 WHERE id = $2`, [identifier, req.user.id]);
        
        res.json({ message: `${type} updated and verified successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error verifying OTP' });
    }
};

module.exports = { getProfile, updateProfile, submitKyc, becomeSeller, getDashboard, addContact, verifyContact };
