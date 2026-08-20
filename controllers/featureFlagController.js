const db = require('../config/db');

// 1. Get all feature flags (public)
const getFeatureFlags = async (req, res) => {
    try {
        const result = await db.query('SELECT key, is_enabled, name, description, updated_at FROM feature_flags');
        
        // Return both an object map (flags: { enable_hero_carousel: true }) and the full array
        const flagsMap = {};
        result.rows.forEach(row => {
            flagsMap[row.key] = row.is_enabled;
        });

        res.json({
            flags: flagsMap,
            list: result.rows
        });
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
};

// 2. Get specific flag status
const getFeatureFlag = async (req, res) => {
    try {
        const { key } = req.params;
        const result = await db.query('SELECT key, is_enabled, name, description, updated_at FROM feature_flags WHERE key = $1', [key]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Feature flag '${key}' not found` });
        }

        res.json({ flag: result.rows[0] });
    } catch (error) {
        console.error('Error fetching feature flag:', error);
        res.status(500).json({ error: 'Failed to fetch feature flag' });
    }
};

// 3. Update feature flag status (Admin)
const updateFeatureFlag = async (req, res) => {
    try {
        const { key } = req.params;
        const { is_enabled } = req.body;

        if (typeof is_enabled !== 'boolean') {
            return res.status(400).json({ error: 'is_enabled must be a boolean' });
        }

        const result = await db.query(
            `UPDATE feature_flags 
             SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE key = $2 
             RETURNING *`,
            [is_enabled, key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Feature flag '${key}' not found` });
        }

        res.json({
            message: `Feature flag '${key}' updated successfully`,
            flag: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating feature flag:', error);
        res.status(500).json({ error: 'Failed to update feature flag' });
    }
};

module.exports = {
    getFeatureFlags,
    getFeatureFlag,
    updateFeatureFlag
};
