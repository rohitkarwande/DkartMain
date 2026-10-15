const featureFlagService = require('../services/admin/featureFlagService');

// 1. Get all feature flags (public)
const getFeatureFlags = async (req, res) => {
    try {
        const data = await featureFlagService.getFeatureFlags();
        res.json(data);
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch feature flags' });
    }
};

// 2. Get specific flag status
const getFeatureFlag = async (req, res) => {
    try {
        const flag = await featureFlagService.getFeatureFlag(req.params.key);
        res.json({ flag });
    } catch (error) {
        console.error('Error fetching feature flag:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch feature flag' });
    }
};

// 3. Update feature flag status (Admin)
const updateFeatureFlag = async (req, res) => {
    try {
        const { key } = req.params;
        const { is_enabled } = req.body;
        const flag = await featureFlagService.updateFeatureFlag(key, is_enabled);
        res.json({
            message: `Feature flag '${key}' updated successfully`,
            flag
        });
    } catch (error) {
        console.error('Error updating feature flag:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update feature flag' });
    }
};

module.exports = {
    getFeatureFlags,
    getFeatureFlag,
    updateFeatureFlag
};
