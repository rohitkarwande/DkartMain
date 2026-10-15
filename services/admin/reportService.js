const db = require('../../config/db');

class ReportService {
    async reportFraud(reporterId, { reported_user_id, equipment_post_id, reason, description }) {
        if (!reason) {
            const err = new Error('Reason is required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            `INSERT INTO fraud_reports (reporter_id, reported_user_id, equipment_post_id, reason, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [reporterId, reported_user_id || null, equipment_post_id || null, reason.trim(), description ? description.trim() : null]
        );
        return result.rows[0];
    }
}

module.exports = new ReportService();
