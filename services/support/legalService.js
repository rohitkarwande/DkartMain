const db = require('../../config/db');
const { sendNotification } = require('../notifications/notificationService');

class LegalService {
    async submitQuery(userId, { subject, description, contact_phone }) {
        if (!subject || !description) {
            const err = new Error('Subject and description are required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            "INSERT INTO legal_consultations (user_id, subject, description, contact_phone) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, subject.trim(), description.trim(), contact_phone || null]
        );
        return result.rows[0];
    }

    async getMyQueries(userId) {
        const result = await db.query(
            "SELECT * FROM legal_consultations WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        return result.rows;
    }

    async getAllQueries() {
        const result = await db.query(
            "SELECT * FROM legal_consultations ORDER BY created_at DESC"
        );
        return result.rows;
    }

    async updateQueryStatus(id, status) {
        if (!['New', 'Reviewing', 'Resolved'].includes(status)) {
            const err = new Error('Invalid status');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            "UPDATE legal_consultations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (result.rows.length === 0) {
            const err = new Error('Legal query not found');
            err.statusCode = 404;
            throw err;
        }

        const query = result.rows[0];

        // Notification dispatch
        await sendNotification(
            query.user_id,
            'Legal Query Update',
            `The status of your legal query "${query.subject}" has been updated to ${status}.`,
            query.id.toString()
        );

        return query;
    }
}

module.exports = new LegalService();
