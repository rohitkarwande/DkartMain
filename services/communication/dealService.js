const db = require('../../config/db');

class DealService {
    /**
     * Get deal history for a user (buyer or seller)
     */
    async getDealHistory(userId) {
        const result = await db.query(
            `SELECT i.*, ep.title as equipment_title, ep.price
             FROM inquiries i
             JOIN equipment_posts ep ON i.equipment_post_id = ep.id
             WHERE i.status = 'Deal Closed' 
             AND (i.buyer_id = $1 OR i.seller_id = $1)
             ORDER BY i.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Get deal conversion metrics for a seller
     */
    async getMetrics(userId) {
        const totalInquiries = await db.query(
            `SELECT COUNT(*) FROM inquiries WHERE seller_id = $1`,
            [userId]
        );
        const closedDeals = await db.query(
            `SELECT COUNT(*) FROM inquiries WHERE seller_id = $1 AND status = 'Deal Closed'`,
            [userId]
        );

        const total = parseInt(totalInquiries.rows[0].count, 10) || 0;
        const closed = parseInt(closedDeals.rows[0].count, 10) || 0;
        const conversionRatio = total > 0 ? ((closed / total) * 100).toFixed(2) + '%' : '0%';

        return {
            total_inquiries: total,
            closed_deals: closed,
            conversion_ratio: conversionRatio
        };
    }
}

module.exports = new DealService();
