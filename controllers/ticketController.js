const db = require('../config/db');

// 1. Create Ticket (User)
const createTicket = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject, description, category, priority } = req.body;

        if (!subject || !description || !category) {
            return res.status(400).json({ error: 'Subject, description, and category are required' });
        }

        const result = await db.query(
            `INSERT INTO support_tickets (user_id, subject, description, category, priority)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, subject, description, category, priority || 'Medium']
        );

        res.status(201).json({ message: 'Support ticket raised successfully', ticket: result.rows[0] });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Server error raising support ticket' });
    }
};

// 2. Get My Tickets (User)
const getMyTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            "SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json({ tickets: result.rows });
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ error: 'Server error fetching support tickets' });
    }
};

// 3. Get All Tickets (Admin)
const getAllTickets = async (req, res) => {
    try {
        const { status } = req.query;
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
        res.json({ tickets: result.rows });
    } catch (error) {
        console.error('Error fetching admin tickets:', error);
        res.status(500).json({ error: 'Server error fetching all support tickets' });
    }
};

// 4. Update Ticket Status (Admin)
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;

        const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
        const allowedPriorities = ['Low', 'Medium', 'High'];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        if (priority && !allowedPriorities.includes(priority)) {
            return res.status(400).json({ error: 'Invalid priority' });
        }

        // Dynamic update statement
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
            return res.status(404).json({ error: 'Support ticket not found' });
        }

        res.json({ message: 'Support ticket updated successfully', ticket: result.rows[0] });
    } catch (error) {
        console.error('Error updating support ticket:', error);
        res.status(500).json({ error: 'Server error updating support ticket' });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getAllTickets,
    updateTicketStatus
};
