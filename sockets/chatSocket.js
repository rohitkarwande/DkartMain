const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = (io) => {
    // Middleware for socket authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id} (Socket ID: ${socket.id})`);

        // Join a chat room
        socket.on('join_room', (roomId) => {
            // Check if user is part of this room (for security)
            db.query(
                `SELECT * FROM chat_rooms cr
                 JOIN inquiries i ON cr.inquiry_id = i.id
                 WHERE cr.id = $1 AND (i.buyer_id = $2 OR i.seller_id = $2)`,
                [roomId, socket.user.id]
            ).then(result => {
                if (result.rows.length > 0) {
                    socket.join(`room_${roomId}`);
                    console.log(`User ${socket.user.id} joined room_${roomId}`);
                }
            }).catch(err => console.error("Error joining room:", err));
        });

        // Leave a chat room
        socket.on('leave_room', (roomId) => {
            socket.leave(`room_${roomId}`);
            console.log(`User ${socket.user.id} left room_${roomId}`);
        });

        // Send a message
        socket.on('send_message', async (data) => {
            try {
                const { roomId, message } = data;
                
                // Save to database
                const result = await db.query(
                    `INSERT INTO messages (room_id, sender_id, message)
                     VALUES ($1, $2, $3)
                     RETURNING *`,
                    [roomId, socket.user.id, message]
                );

                const savedMessage = result.rows[0];

                // Broadcast to all users in the room
                io.to(`room_${roomId}`).emit('receive_message', savedMessage);
            } catch (error) {
                console.error("Error sending message via socket:", error);
                socket.emit('error', 'Could not send message');
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });
};
