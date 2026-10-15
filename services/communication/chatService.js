const db = require('../../config/db');

class ChatService {
    /**
     * Create chat room for inquiry or return existing room
     */
    async createRoom({ inquiryId, io }) {
        const existingRoom = await db.query(
            `SELECT * FROM chat_rooms WHERE inquiry_id = $1`,
            [inquiryId]
        );

        if (existingRoom.rows.length > 0) {
            return {
                alreadyExists: true,
                message: 'Chat room already exists',
                room: existingRoom.rows[0]
            };
        }

        const room = await db.query(
            `INSERT INTO chat_rooms (inquiry_id) VALUES ($1) RETURNING *`,
            [inquiryId]
        );

        // Auto-advance inquiry status to 'In Progress' when chat room opens
        await db.query(
            `UPDATE inquiries SET status = 'In Progress' WHERE id = $1 AND status = 'Pending'`,
            [inquiryId]
        );

        // Notify Admins
        try {
            const { notifyAdmins } = require('../notifications/adminNotificationService');
            notifyAdmins(io, 'NEW_CHAT_ROOM', `A new chat room was created for Inquiry #${inquiryId}`, inquiryId);
        } catch (err) {
            console.error('Error notifying admins of new chat room:', err.message);
        }

        return {
            alreadyExists: false,
            message: 'Chat room created',
            room: room.rows[0]
        };
    }

    /**
     * Get all messages in a room
     */
    async getMessages(roomId) {
        const result = await db.query(
            `SELECT *
             FROM messages
             WHERE room_id = $1
             ORDER BY created_at ASC`,
            [roomId]
        );
        return result.rows;
    }

    /**
     * Send message in a chat room, emit socket event, and notify recipient via email
     */
    async sendMessage({ roomId, senderId, message, io }) {
        const result = await db.query(
            `INSERT INTO messages
             (room_id, sender_id, message)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [roomId, senderId, message]
        );

        const savedMessage = result.rows[0];

        // Broadcast to socket room
        if (io) {
            io.to(`room_${roomId}`).emit('receive_message', savedMessage);
        }

        // Email the other participant in this chat room
        try {
            const roomInfo = await db.query(
                `SELECT i.buyer_id, i.seller_id, ep.title as equipment_title,
                        sender.email as sender_email,
                        COALESCE(sp.first_name, sender.email, sender.phone) as sender_name
                 FROM chat_rooms cr
                 JOIN inquiries i ON cr.inquiry_id = i.id
                 JOIN equipment_posts ep ON i.equipment_post_id = ep.id
                 JOIN users sender ON sender.id = $2
                 LEFT JOIN user_profiles sp ON sp.user_id = $2
                 WHERE cr.id = $1`,
                [roomId, senderId]
            );
            if (roomInfo.rows.length > 0) {
                const { buyer_id, seller_id, equipment_title, sender_name } = roomInfo.rows[0];
                const recipientId = senderId === buyer_id ? seller_id : buyer_id;
                const { emailNewMessage } = require('../notifications/emailService');
                emailNewMessage(recipientId, sender_name || "A Dr's Kart user", message, equipment_title);
            }
        } catch (emailErr) {
            console.error('Failed to send message notification email:', emailErr);
        }

        return savedMessage;
    }

    /**
     * Get all chat rooms for a user
     */
    async getRooms(userId) {
        const result = await db.query(
            `SELECT cr.*, i.equipment_post_id, i.buyer_id, i.seller_id, i.status as inquiry_status
             FROM chat_rooms cr
             JOIN inquiries i ON cr.inquiry_id = i.id
             WHERE i.buyer_id = $1 OR i.seller_id = $1
             ORDER BY cr.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Mark a message as read
     */
    async markMessageAsRead({ messageId, userId }) {
        const result = await db.query(
            `UPDATE messages
             SET is_read = true
             WHERE id = $1 AND sender_id != $2
             RETURNING *`,
            [messageId, userId]
        );

        if (result.rows.length === 0) {
            const err = new Error('Message not found or not authorized to mark as read');
            err.statusCode = 404;
            throw err;
        }

        return result.rows[0];
    }
}

module.exports = new ChatService();
