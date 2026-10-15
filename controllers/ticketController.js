const ticketService = require('../services/support/ticketService');

// 1. Create Ticket (User)
const createTicket = async (req, res) => {
    try {
        const ticket = await ticketService.createTicket({
            userId: req.user.id,
            ...req.body
        });
        res.status(201).json({ message: 'Support ticket raised successfully', ticket });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error raising support ticket' });
    }
};

// 2. Get My Tickets (User)
const getMyTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getMyTickets(req.user.id);
        res.json({ tickets });
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error fetching support tickets' });
    }
};

// 3. Get All Tickets (Admin)
const getAllTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getAllTickets(req.query.status);
        res.json({ tickets });
    } catch (error) {
        console.error('Error fetching admin tickets:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error fetching all support tickets' });
    }
};

// 4. Update Ticket Status (Admin)
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await ticketService.updateTicketStatus(id, req.body);
        res.json({ message: 'Support ticket updated successfully', ticket });
    } catch (error) {
        console.error('Error updating support ticket:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error updating support ticket' });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getAllTickets,
    updateTicketStatus
};
