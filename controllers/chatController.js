const chatService = require('../services/communication/chatService');

const createRoom = async (req, res) => {
    try {
        const { inquiry_id } = req.body;
        const result = await chatService.createRoom({
            inquiryId: inquiry_id,
            io: req.io
        });

        if (result.alreadyExists) {
            return res.status(200).json({
                message: result.message,
                room: result.room
            });
        }

        res.status(201).json({
            message: result.message,
            room: result.room
        });
    } catch (error) {
        console.error('Error in createRoom:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const messages = await chatService.getMessages(id);
        res.json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const savedMessage = await chatService.sendMessage({
            roomId: id,
            senderId: req.user.id,
            message,
            io: req.io
        });

        res.status(201).json({
            message: 'Message sent',
            data: savedMessage
        });
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const getRooms = async (req, res) => {
    try {
        const rooms = await chatService.getRooms(req.user.id);
        res.json(rooms);
    } catch (error) {
        console.error('Error in getRooms:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const updated = await chatService.markMessageAsRead({
            messageId,
            userId: req.user.id
        });
        res.json({ message: 'Message marked as read', data: updated });
    } catch (error) {
        console.error('Error in markMessageAsRead:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

module.exports = {
    createRoom,
    getMessages,
    sendMessage,
    getRooms,
    markMessageAsRead
};