const db = require('../../config/db');

class TicketService {
    async createTicket({ userId, subject, description, category, priority = 'Medium' }) {
        if (!subject || !description || !category) {
            const err = new Error('Subject, description, and category are required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            `INSERT INTO support_tickets (user_id, subject, description, category, priority)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, subject.trim(), description.trim(), category.trim(), priority || 'Medium']
        );
        return result.rows[0];
    }

    async getMyTickets(userId) {
        const result = await db.query(
            "SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        return result.rows;
    }

    async getAllTickets(status = null) {
        let query = `
            SELECT t.*, u.email as user_email, u.phone as user_phone, u.role as user_role
            FROM support_tickets t
            JOIN users u ON t.user_id = u.id
        `;
        const params = [];
        if (status) {
            query += " WHERE t.status = $1";
            params.push(status);
        }
        query += " ORDER BY t.created_at DESC";

        const result = await db.query(query, params);
        return result.rows;
    }

    async updateTicketStatus(id, { status, priority }) {
        const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
        const allowedPriorities = ['Low', 'Medium', 'High'];

        if (status && !allowedStatuses.includes(status)) {
            const err = new Error('Invalid status');
            err.statusCode = 400;
            throw err;
        }
        if (priority && !allowedPriorities.includes(priority)) {
            const err = new Error('Invalid priority');
            err.statusCode = 400;
            throw err;
        }

        let query = "UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP";
        const params = [];
        let index = 1;

        if (status) {
            query += `, status = $${index}`;
            params.push(status);
            index++;
        }
        if (priority) {
            query += `, priority = $${index}`;
            params.push(priority);
            index++;
        }

        query += ` WHERE id = $${index} RETURNING *`;
        params.push(id);

        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            const err = new Error('Support ticket not found');
            err.statusCode = 404;
            throw err;
        }

        return result.rows[0];
    }
}

module.exports = new TicketService();
