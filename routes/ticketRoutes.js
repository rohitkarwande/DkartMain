const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/role');

// User routes
router.post('/', authMiddleware, ticketController.createTicket);
router.get('/mine', authMiddleware, ticketController.getMyTickets);

// Admin routes
router.get('/admin/all', authMiddleware, isAdmin, ticketController.getAllTickets);
router.patch('/admin/:id/status', authMiddleware, isAdmin, ticketController.updateTicketStatus);

module.exports = router;
