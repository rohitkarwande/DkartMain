const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

// Public route to fetch active banners for homepage
router.get('/', bannerController.getActiveBanners);

module.exports = router;
