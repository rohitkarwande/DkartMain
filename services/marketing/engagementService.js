const db = require('../../config/db');

class EngagementService {
    /**
     * Get user notifications
     */
    async getUserNotifications(userId) {
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead({ notificationId, userId }) {
        const result = await db.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [notificationId, userId]
        );

        return result.rows[0];
    }

    /**
     * Get user's recently viewed equipment
     */
    async getRecentlyViewed(userId) {
        const result = await db.query(
            `SELECT r.id as view_id, e.* 
             FROM recently_viewed r
             JOIN equipment_posts e ON r.equipment_post_id = e.id
             WHERE r.user_id = $1
             ORDER BY r.viewed_at DESC
             LIMIT 10`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Get equipment suggestions for user
     */
    async getSuggestions(userId) {
        const result = await db.query(
            `SELECT * FROM equipment_posts 
             WHERE status = 'Active' 
             AND id NOT IN (
                 SELECT equipment_post_id FROM recently_viewed WHERE user_id = $1
             )
             ORDER BY created_at DESC 
             LIMIT 5`,
            [userId]
        );
        return result.rows;
    }
}

module.exports = new EngagementService();
