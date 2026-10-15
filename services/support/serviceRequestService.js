const db = require('../../config/db');

class ServiceRequestService {
    async createRequest(userId, { equipment_type, issue_description, contact_name, contact_phone, city }) {
        if (!issue_description) {
            const err = new Error('Issue description is required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            "INSERT INTO service_requests (user_id, equipment_type, issue_description, contact_name, contact_phone, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [userId, equipment_type, issue_description.trim(), contact_name, contact_phone, city]
        );
        return result.rows[0];
    }

    async getMyRequests(userId) {
        const result = await db.query(
            "SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        return result.rows;
    }

    async getAllRequests() {
        const result = await db.query("SELECT * FROM service_requests ORDER BY created_at DESC");
        return result.rows;
    }

    async updateRequestStatus(id, { status, assigned_to }) {
        if (!['Pending', 'In Progress', 'Completed', 'Rejected'].includes(status)) {
            const err = new Error('Invalid status');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            "UPDATE service_requests SET status = $1, assigned_to = COALESCE($2, assigned_to), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
            [status, assigned_to, id]
        );

        if (result.rows.length === 0) {
            const err = new Error('Service request not found');
            err.statusCode = 404;
            throw err;
        }

        return result.rows[0];
    }
}

module.exports = new ServiceRequestService();
