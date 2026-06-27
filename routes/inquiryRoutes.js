const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/role');
const inquiryController = require('../controllers/inquiryController');

router.post('/', authMiddleware, inquiryController.createInquiry);
router.get('/seller', authMiddleware, inquiryController.getSellerInquiries);
router.get('/buyer', authMiddleware, inquiryController.getBuyerInquiries);
router.patch('/:id/status', authMiddleware, inquiryController.updateInquiryStatus);
router.get('/:id', authMiddleware, inquiryController.getInquiryById);

// Admin only: platform-wide funnel analytics
router.get('/admin/funnel', authMiddleware, isAdmin, inquiryController.getAdminFunnelStats);

module.exports = router;