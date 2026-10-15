const contactService = require('../services/support/contactService');

const submitContactMessage = async (req, res) => {
    try {
        const message = await contactService.submitMessage(req.body);
        res.status(201).json({ message: 'Contact message submitted successfully', data: message });
    } catch (error) {
        console.error('Error submitting contact message:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error submitting contact message' });
    }
};

const getContactMessages = async (req, res) => {
    try {
        const messages = await contactService.getMessages();
        res.json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error fetching contact messages' });
    }
};

const updateContactMessageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = await contactService.updateMessageStatus(id, status);
        res.json({ message: 'Status updated successfully', data: updated });
    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error updating contact status' });
    }
};

module.exports = {
    submitContactMessage,
    getContactMessages,
    updateContactMessageStatus
};
