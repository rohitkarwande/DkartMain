const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

// Public route to fetch active banners for homepage
router.get('/', bannerController.getActiveBanners);

// Public routes for impression/view and click tracking
router.post('/:id/view', bannerController.trackBannerView);
router.post('/:id/click', bannerController.trackBannerClick);

module.exports = router;

