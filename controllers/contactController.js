const db = require('../config/db');

const submitContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Name, email, subject, and message are required' });
        }
        const result = await db.query(
            `INSERT INTO contact_messages (name, email, phone, subject, message)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, email, phone, subject, message]
        );
        res.status(201).json({ message: 'Contact message submitted successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error submitting contact message:', error);
        res.status(500).json({ error: 'Server error submitting contact message' });
    }
};

const getContactMessages = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ error: 'Server error fetching contact messages' });
    }
};

const updateContactMessageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['New', 'Read', 'Resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await db.query(
            'UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Contact message not found' });
        res.json({ message: 'Status updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(500).json({ error: 'Server error updating contact status' });
    }
};

module.exports = {
    submitContactMessage,
    getContactMessages,
    updateContactMessageStatus
};
