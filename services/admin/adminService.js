const db = require('../../config/db');

const generateCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const escapeCsv = (str) => {
        if (str === null || str === undefined) return '';
        const s = String(str);
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const csvRows = [headers.join(',')];
    for (const row of data) {
        csvRows.push(headers.map(header => escapeCsv(row[header])).join(','));
    }
    return csvRows.join('\n');
};

class AdminService {
    /**
     * Dashboard statistics across users, listings, inquiries, kyc, promotions, and tickets
     */
    async getDashboardStats() {
        const [usersCount, sellersCount, listingsCount, inquiriesCount, pendingKycCount, totalRevenueRows, professionRows, pendingPromosCount, openTicketsCount] =
            await Promise.all([
                db.query("SELECT COUNT(*) FROM users WHERE role = 'user' OR role = 'buyer'"),
                db.query("SELECT COUNT(*) FROM users WHERE role = 'seller'"),
                db.query("SELECT COUNT(*) FROM equipment_posts"),
                db.query("SELECT COUNT(*) FROM inquiries WHERE status != 'Resolved' AND status != 'Closed'"),
                db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Pending'"),
                db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Approved'"),
                db.query("SELECT profession, COUNT(*) FROM user_profiles WHERE profession IS NOT NULL GROUP BY profession"),
                db.query("SELECT COUNT(*) FROM promotions WHERE status = 'Pending'"),
                db.query("SELECT COUNT(*) FROM support_tickets WHERE status = 'Open' OR status = 'In Progress'"),
            ]);

        const professions = professionRows.rows.reduce((acc, row) => {
            acc[row.profession] = parseInt(row.count, 10);
            return acc;
        }, {});

        return {
            totalUsers: parseInt(usersCount.rows[0].count, 10),
            totalSellers: parseInt(sellersCount.rows[0].count, 10),
            totalListings: parseInt(listingsCount.rows[0].count, 10),
            activeInquiries: parseInt(inquiriesCount.rows[0].count, 10),
            pendingKyc: parseInt(pendingKycCount.rows[0].count, 10),
            approvedKyc: parseInt(totalRevenueRows.rows[0].count, 10),
            pendingPromotions: parseInt(pendingPromosCount.rows[0].count, 10),
            openTickets: parseInt(openTicketsCount.rows[0].count, 10),
            professions,
        };
    }

    /**
     * User management: get all users with filters
     */
    async getAllUsers({ search, role, status }) {
        let query = `
            SELECT u.id, u.email, u.phone, u.is_verified, u.role, u.status, u.created_at, u.paid_promotions_enabled,
                   p.first_name, p.last_name, p.company_name,
                   k.status AS kyc_status, k.document_type
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN kyc_documents k ON u.id = k.user_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.company_name ILIKE $${params.length})`;
        }
        if (role) {
            params.push(role);
            query += ` AND u.role = $${params.length}`;
        }
        if (status) {
            params.push(status);
            query += ` AND u.status = $${params.length}`;
        }
        query += ' ORDER BY u.created_at DESC';

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Update user status
     */
    async updateUserStatus(id, status) {
        if (!['Active', 'Blocked', 'Suspended'].includes(status)) {
            const err = new Error('Invalid status');
            err.statusCode = 400;
            throw err;
        }
        const result = await db.query(
            "UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, status",
            [status, id]
        );
        if (result.rows.length === 0) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Suspend user
     */
    async suspendUser(id) {
        const result = await db.query(
            "UPDATE users SET status = 'Suspended', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, status",
            [id]
        );
        if (result.rows.length === 0) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Reactivate user
     */
    async reactivateUser(id) {
        const result = await db.query(
            "UPDATE users SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, status",
            [id]
        );
        if (result.rows.length === 0) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Get all listings for moderation
     */
    async getAllListings() {
        const result = await db.query("SELECT * FROM equipment_posts ORDER BY created_at DESC");
        return result.rows;
    }

    /**
     * Update equipment listing status
     */
    async updateListingStatus(id, status) {
        const result = await db.query(
            "UPDATE equipment_posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [status, id]
        );
        if (result.rows.length === 0) {
            const err = new Error('Listing not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Category operations
     */
    async getCategories() {
        const result = await db.query("SELECT * FROM categories ORDER BY name ASC");
        return result.rows;
    }

    async createCategory({ name, description }) {
        if (!name) {
            const err = new Error('Category name required');
            err.statusCode = 400;
            throw err;
        }
        const result = await db.query(
            "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );
        return result.rows[0];
    }

    async updateCategory({ id, name, description, is_active }) {
        const result = await db.query(
            "UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *",
            [name, description, is_active, id]
        );
        if (result.rows.length === 0) {
            const err = new Error('Category not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    async deleteCategory(id) {
        const result = await db.query("DELETE FROM categories WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            const err = new Error('Category not found');
            err.statusCode = 404;
            throw err;
        }
        return { message: 'Category deleted' };
    }

    /**
     * Get all platform inquiries
     */
    async getAllInquiries() {
        const result = await db.query("SELECT * FROM inquiries ORDER BY created_at DESC");
        return result.rows;
    }

    /**
     * KYC Management
     */
    async getPendingKycApplications({ status = 'all', search }) {
        let query = `
            SELECT 
                k.id AS kyc_id,
                k.user_id,
                k.document_type,
                k.document_url,
                k.document_file_url,
                k.status AS kyc_status,
                k.rejection_reason,
                k.submitted_at,
                k.reviewed_at,
                k.reviewed_by,
                u.email,
                u.phone,
                u.role,
                u.status AS user_status,
                u.created_at AS user_created_at,
                p.first_name,
                p.last_name,
                p.company_name
            FROM kyc_documents k
            JOIN users u ON k.user_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status !== 'all') {
            params.push(status);
            query += ` AND k.status = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR p.first_name ILIKE $${params.length} OR p.company_name ILIKE $${params.length} OR k.document_type ILIKE $${params.length})`;
        }

        query += ' ORDER BY k.submitted_at DESC';

        const result = await db.query(query, params);
        return result.rows;
    }

    async getKycDetails(userId) {
        const result = await db.query(
            `SELECT 
                k.*,
                u.email,
                u.phone,
                u.role,
                u.status AS user_status,
                u.created_at AS user_created_at,
                p.first_name,
                p.last_name,
                p.company_name,
                p.bio
            FROM kyc_documents k
            JOIN users u ON k.user_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE k.user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            const err = new Error('KYC application not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    async approveKyc({ userId, adminId, io }) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const kycResult = await client.query(
                `UPDATE kyc_documents 
                 SET status = 'Approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = NULL
                 WHERE user_id = $2 
                 RETURNING *`,
                [adminId, userId]
            );
            if (kycResult.rows.length === 0) {
                await client.query('ROLLBACK');
                const err = new Error('KYC application not found');
                err.statusCode = 404;
                throw err;
            }

            await client.query(
                "UPDATE users SET role = 'seller', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                [userId]
            );

            await client.query(
                `INSERT INTO notifications (user_id, type, message, reference_id)
                 VALUES ($1, 'KYC_APPROVED', 'Congratulations! Your Seller account has been approved. You can now list equipment on Dr''s Kart.', $2)`,
                [userId, kycResult.rows[0].id]
            );

            await client.query('COMMIT');

            if (io) {
                io.to(`user_${userId}`).emit('role_updated', {
                    role: 'seller',
                    message: "🎉 Congratulations! Your Seller account has been approved. You can now list equipment on Dr's Kart.",
                });
            }

            return kycResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async rejectKyc({ userId, adminId, reason, io }) {
        if (!reason || !reason.trim()) {
            const err = new Error('Rejection reason is required');
            err.statusCode = 400;
            throw err;
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const kycResult = await client.query(
                `UPDATE kyc_documents 
                 SET status = 'Rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = $2
                 WHERE user_id = $3 
                 RETURNING *`,
                [adminId, reason.trim(), userId]
            );
            if (kycResult.rows.length === 0) {
                await client.query('ROLLBACK');
                const err = new Error('KYC application not found');
                err.statusCode = 404;
                throw err;
            }

            await client.query(
                `INSERT INTO notifications (user_id, type, message, reference_id)
                 VALUES ($1, 'KYC_REJECTED', $2, $3)`,
                [userId, `Your seller application was not approved. Reason: ${reason.trim()}. You may reapply after making corrections.`, kycResult.rows[0].id]
            );

            await client.query('COMMIT');

            if (io) {
                io.to(`user_${userId}`).emit('role_updated', {
                    role: null,
                    kycStatus: 'Rejected',
                    message: `Your seller application was not approved. Reason: ${reason.trim()}`,
                });
            }

            return kycResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reports Export
     */
    async getReportData(type) {
        let filename = 'report.csv';
        let data = [];

        if (type === 'summary') {
            const [usersCount, sellersCount, listingsCount, inquiriesCount, pendingKycCount, approvedKycCount] =
                await Promise.all([
                    db.query("SELECT COUNT(*) FROM users WHERE role = 'user' OR role = 'buyer'"),
                    db.query("SELECT COUNT(*) FROM users WHERE role = 'seller'"),
                    db.query("SELECT COUNT(*) FROM equipment_posts"),
                    db.query("SELECT COUNT(*) FROM inquiries WHERE status != 'Resolved' AND status != 'Closed'"),
                    db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Pending'"),
                    db.query("SELECT COUNT(*) FROM kyc_documents WHERE status = 'Approved'"),
                ]);
            data = [{
                total_buyers: usersCount.rows[0].count,
                total_sellers: sellersCount.rows[0].count,
                total_listings: listingsCount.rows[0].count,
                active_inquiries: inquiriesCount.rows[0].count,
                pending_kyc: pendingKycCount.rows[0].count,
                approved_kyc: approvedKycCount.rows[0].count,
                exported_at: new Date().toISOString()
            }];
            filename = 'dashboard_summary.csv';
        } else if (type === 'buyers') {
            const result = await db.query(`
                SELECT u.id, u.email, u.phone, u.status, u.created_at, p.first_name, p.last_name 
                FROM users u 
                LEFT JOIN user_profiles p ON u.id = p.user_id 
                WHERE u.role IN ('user', 'buyer')
                ORDER BY u.created_at DESC
            `);
            data = result.rows;
            filename = 'buyers_list.csv';
        } else if (type === 'sellers') {
            const result = await db.query(`
                SELECT u.id, u.email, u.phone, u.status, u.created_at, p.first_name, p.last_name, p.company_name 
                FROM users u 
                LEFT JOIN user_profiles p ON u.id = p.user_id 
                WHERE u.role = 'seller'
                ORDER BY u.created_at DESC
            `);
            data = result.rows;
            filename = 'sellers_list.csv';
        } else if (type === 'kyc') {
            const result = await db.query(`
                SELECT k.id, k.user_id, u.email, k.document_type, k.status, k.submitted_at, k.reviewed_at 
                FROM kyc_documents k 
                JOIN users u ON k.user_id = u.id 
                ORDER BY k.submitted_at DESC
            `);
            data = result.rows;
            filename = 'kyc_applications.csv';
        } else {
            const err = new Error('Invalid report type');
            err.statusCode = 400;
            throw err;
        }

        return {
            csvString: generateCSV(data),
            filename
        };
    }

    /**
     * Toggle paid promotions access
     */
    async togglePaidPromotionsAccess(id, enabled) {
        if (typeof enabled !== 'boolean') {
            const err = new Error('enabled must be a boolean');
            err.statusCode = 400;
            throw err;
        }
        const result = await db.query(
            "UPDATE users SET paid_promotions_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, role, paid_promotions_enabled",
            [enabled, id]
        );
        if (result.rows.length === 0) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Fraud reports
     */
    async getFraudReports() {
        const query = `
            SELECT r.id, r.reporter_id, r.reported_user_id, r.equipment_post_id, r.reason, r.description, r.status, r.created_at,
                   u_rep.email as reporter_email, p_rep.first_name as reporter_first_name, p_rep.last_name as reporter_last_name,
                   u_seller.email as seller_email, p_seller.company_name as seller_company,
                   ep.title as equipment_title, ep.category as equipment_category, ep.status as equipment_status
            FROM fraud_reports r
            LEFT JOIN users u_rep ON r.reporter_id = u_rep.id
            LEFT JOIN user_profiles p_rep ON r.reporter_id = p_rep.user_id
            LEFT JOIN users u_seller ON r.reported_user_id = u_seller.id
            LEFT JOIN user_profiles p_seller ON r.reported_user_id = p_seller.user_id
            LEFT JOIN equipment_posts ep ON r.equipment_post_id = ep.id
            ORDER BY r.created_at DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async updateReportStatus(id, status) {
        if (!['Pending', 'Reviewed', 'Resolved'].includes(status)) {
            const err = new Error('Invalid status');
            err.statusCode = 400;
            throw err;
        }
        const result = await db.query(
            "UPDATE fraud_reports SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        if (result.rows.length === 0) {
            const err = new Error('Report not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Admin notifications
     */
    async getAdminNotifications(adminId) {
        const result = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [adminId]
        );
        return result.rows;
    }

    async markNotificationRead(id, adminId) {
        const result = await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, adminId]
        );
        if (result.rows.length === 0) {
            const err = new Error('Notification not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Security & IP Blacklist
     */
    async getLoginHistory(search) {
        let query = `
            SELECT lh.*, u.email, u.phone, u.role
            FROM login_history lh
            JOIN users u ON lh.user_id = u.id
        `;
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            query += ` WHERE u.email ILIKE $1 OR u.phone ILIKE $1 OR lh.ip_address ILIKE $1`;
        }
        query += ` ORDER BY lh.created_at DESC LIMIT 100`;

        const result = await db.query(query, params);
        return result.rows;
    }

    async getIpBlacklist() {
        const result = await db.query("SELECT * FROM ip_blacklist ORDER BY created_at DESC");
        return result.rows;
    }

    async addIpToBlacklist(ip_address, reason) {
        if (!ip_address) {
            const err = new Error('IP address is required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            "INSERT INTO ip_blacklist (ip_address, reason) VALUES ($1, $2) ON CONFLICT (ip_address) DO UPDATE SET reason = $2 RETURNING *",
            [ip_address, reason || 'Manually blacklisted by admin']
        );
        return result.rows[0];
    }

    async removeIpFromBlacklist(ip) {
        const result = await db.query("DELETE FROM ip_blacklist WHERE ip_address = $1 RETURNING *", [ip]);
        if (result.rows.length === 0) {
            const err = new Error('IP not found in blacklist');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }
}

module.exports = new AdminService();
