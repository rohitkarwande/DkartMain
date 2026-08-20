const express = require('express');
const router = express.Router();
const featureFlagController = require('../controllers/featureFlagController');

// Public routes for feature flags
router.get('/', featureFlagController.getFeatureFlags);
router.get('/:key', featureFlagController.getFeatureFlag);

module.exports = router;
