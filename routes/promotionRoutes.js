const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const authMiddleware = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/role');

// Public
router.get('/plans', promotionController.getPlans);

// Seller — authenticated
router.post('/request', authMiddleware, promotionController.requestPromotion);
router.get('/mine', authMiddleware, promotionController.getMyPromotions);

// Admin
router.get('/admin', authMiddleware, isAdmin, promotionController.adminListPromotions);
router.patch('/:id/status', authMiddleware, isAdmin, promotionController.adminUpdatePromotionStatus);

module.exports = router;
