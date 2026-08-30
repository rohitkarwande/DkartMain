const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/role');

// Public route to submit inquiry
router.post('/', contactController.submitContactMessage);

// Protected admin routes to view/manage inquiries
router.get('/admin/all', authMiddleware, isAdmin, contactController.getContactMessages);
router.patch('/admin/:id/status', authMiddleware, isAdmin, contactController.updateContactMessageStatus);

module.exports = router;
