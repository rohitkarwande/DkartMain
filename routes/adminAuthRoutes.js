const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const authMiddleware = require('../middlewares/auth');

// Public to admins: requesting dual OTP and verifying dual OTP
router.post('/request-dual-otp', adminAuthController.requestDualOtp);
router.post('/verify-dual-otp', adminAuthController.verifyDualOtp);

// Checking active admin session (requires authMiddleware)
router.get('/session', authMiddleware, adminAuthController.checkAdminSession);

module.exports = router;
