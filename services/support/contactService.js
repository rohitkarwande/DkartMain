const db = require('../../config/db');

class ContactService {
    async submitMessage({ name, email, phone, subject, message }) {
        if (!name || !email || !subject || !message) {
            const err = new Error('Name, email, subject, and message are required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            `INSERT INTO contact_messages (name, email, phone, subject, message)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, subject.trim(), message.trim()]
        );
        return result.rows[0];
    }

    async getMessages() {
        const result = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        return result.rows;
    }

    async updateMessageStatus(id, status) {
        if (!['New', 'Read', 'Resolved'].includes(status)) {
            const err = new Error('Invalid status');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            'UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) {
            const err = new Error('Contact message not found');
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }
}

module.exports = new ContactService();
