const db = require('../../config/db');
const cache = require('../../config/cache');
const { sendOTP: sendPhoneOTP } = require('../../config/twilio');
const { sendEmailOTP } = require('../../config/email');

class UserService {
    /**
     * Get user profile details
     */
    async getProfile(userId) {
        const result = await db.query(
            `SELECT u.id, u.email, u.phone, u.is_verified, u.created_at, u.role, u.paid_promotions_enabled,
                    p.first_name, p.last_name, p.company_name, p.avatar_url, p.bio, p.age, p.profession, p.location
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [userId]
        );
        return result.rows[0];
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, data) {
        const { first_name, last_name, company_name, avatar_url, bio, age, profession, location } = data;

        const result = await db.query(
            `INSERT INTO user_profiles (user_id, first_name, last_name, company_name, avatar_url, bio, age, profession, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (user_id) DO UPDATE 
             SET first_name = EXCLUDED.first_name,
                 last_name = EXCLUDED.last_name,
                 company_name = EXCLUDED.company_name,
                 avatar_url = EXCLUDED.avatar_url,
                 bio = EXCLUDED.bio,
                 age = EXCLUDED.age,
                 profession = EXCLUDED.profession,
                 location = EXCLUDED.location,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, first_name, last_name, company_name, avatar_url, bio, age, profession, location]
        );

        return result.rows[0];
    }

    /**
     * Submit KYC documents and update company name
     */
    async submitKyc({ userId, data, file, io, userContact }) {
        const { document_type, company_name } = data;
        const document_url = data.document_url || null;
        const document_file_url = file ? `/uploads/kyc/${file.filename}` : null;

        if (!document_type) {
            const err = new Error('document_type is required');
            err.statusCode = 400;
            throw err;
        }
        if (!document_url && !document_file_url) {
            const err = new Error('Either a document number or a document file upload is required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            `INSERT INTO kyc_documents (user_id, document_type, document_url, document_file_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE
             SET document_type = EXCLUDED.document_type,
                 document_url = COALESCE(EXCLUDED.document_url, kyc_documents.document_url),
                 document_file_url = COALESCE(EXCLUDED.document_file_url, kyc_documents.document_file_url),
                 status = 'Pending',
                 rejection_reason = NULL,
                 submitted_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, document_type, document_url, document_file_url]
        );

        if (company_name && company_name.trim()) {
            await db.query(
                `INSERT INTO user_profiles (user_id, company_name)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id) DO UPDATE SET company_name = EXCLUDED.company_name, updated_at = CURRENT_TIMESTAMP`,
                [userId, company_name.trim()]
            );
        }

        // Notify Admins
        try {
            const { notifyAdmins } = require('../notifications/adminNotificationService');
            notifyAdmins(io, 'KYC_SUBMITTED', `User #${userId} submitted a new KYC document`, result.rows[0].id);

            const { emailKycSubmission } = require('../notifications/emailService');
            emailKycSubmission(userId, userContact);
        } catch (notifErr) {
            console.error('Error notifying admins of KYC submission:', notifErr.message);
        }

        return result.rows[0];
    }

    /**
     * Get KYC status
     */
    async getKycStatus(userId) {
        const result = await db.query(
            `SELECT id, document_type, document_url, document_file_url, status, rejection_reason, submitted_at, reviewed_at
             FROM kyc_documents
             WHERE user_id = $1
             ORDER BY submitted_at DESC
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return { status: 'not_submitted' };
        }
        return result.rows[0];
    }

    /**
     * Get user dashboard statistics
     */
    async getDashboard(userId) {
        const postsRes = await db.query("SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1 AND status != 'Archived'", [userId]);
        const inquiriesRes = await db.query("SELECT COUNT(*) FROM inquiries WHERE seller_id = $1 OR buyer_id = $1", [userId]);

        const metricsRes = await db.query(`
            SELECT 
                COALESCE(SUM(em.view_count), 0) as total_views,
                COALESCE(SUM(em.click_count), 0) as total_clicks
            FROM equipment_posts ep
            LEFT JOIN engagement_metrics em ON em.equipment_post_id = ep.id
            WHERE ep.seller_id = $1 AND ep.status != 'Archived'
        `, [userId]);

        const bannerRes = await db.query(`
            SELECT 
                COALESCE(SUM(views_count), 0) as banner_views,
                COALESCE(SUM(clicks_count), 0) as banner_clicks
            FROM hero_banners
            WHERE seller_id = $1 OR equipment_post_id IN (SELECT id FROM equipment_posts WHERE seller_id = $1)
        `, [userId]);

        const totalViews = parseInt(metricsRes.rows[0].total_views, 10);
        const totalClicks = parseInt(metricsRes.rows[0].total_clicks, 10);
        const bannerViews = parseInt(bannerRes.rows[0].banner_views, 10);
        const bannerClicks = parseInt(bannerRes.rows[0].banner_clicks, 10);

        return {
            message: 'Welcome to Dashboard',
            stats: {
                totalPosts: parseInt(postsRes.rows[0].count, 10),
                totalInquiries: parseInt(inquiriesRes.rows[0].count, 10),
                totalViews,
                totalClicks,
                bannerViews,
                bannerClicks,
                productCtr: totalViews > 0 ? parseFloat(((totalClicks / totalViews) * 100).toFixed(1)) : 0,
                bannerCtr: bannerViews > 0 ? parseFloat(((bannerClicks / bannerViews) * 100).toFixed(1)) : 0
            }
        };
    }

    /**
     * Dispatch OTP to verify and add secondary contact method
     */
    async addContact({ userId, identifier, type }) {
        if (!identifier || !type) {
            const err = new Error('identifier and type required');
            err.statusCode = 400;
            throw err;
        }

        const existing = await db.query(`SELECT id FROM users WHERE ${type} = $1`, [identifier]);
        if (existing.rows.length > 0) {
            const err = new Error('This contact is already registered to another account.');
            err.statusCode = 400;
            throw err;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await cache.setEx(`contact-otp:${userId}:${identifier}`, 300, otp);

        if (type === 'email') await sendEmailOTP(identifier, otp);
        else await sendPhoneOTP(identifier, otp);

        return { message: `OTP sent to ${identifier}` };
    }

    /**
     * Verify OTP and bind new contact method to user
     */
    async verifyContact({ userId, identifier, type, otp }) {
        const cachedOtp = await cache.get(`contact-otp:${userId}:${identifier}`);
        if (!cachedOtp || cachedOtp !== otp) {
            const err = new Error('Invalid or expired OTP');
            err.statusCode = 400;
            throw err;
        }

        await cache.del(`contact-otp:${userId}:${identifier}`);
        await db.query(`UPDATE users SET ${type} = $1 WHERE id = $2`, [identifier, userId]);

        return { message: `${type} updated and verified successfully` };
    }
}

module.exports = new UserService();
