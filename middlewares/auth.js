const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch current role and verification status from DB for real-time role syncing
        const userRes = await db.query('SELECT id, email, phone, role, is_verified FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = {
            ...decoded,
            ...userRes.rows[0]
        };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
