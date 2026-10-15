const db = require('../../config/db');

class FeatureFlagService {
    /**
     * Get all feature flags
     */
    async getFeatureFlags() {
        const result = await db.query('SELECT key, is_enabled, name, description, updated_at FROM feature_flags');
        
        const flagsMap = {};
        result.rows.forEach(row => {
            flagsMap[row.key] = row.is_enabled;
        });

        return {
            flags: flagsMap,
            list: result.rows
        };
    }

    /**
     * Get specific feature flag by key
     */
    async getFeatureFlag(key) {
        const result = await db.query(
            'SELECT key, is_enabled, name, description, updated_at FROM feature_flags WHERE key = $1',
            [key]
        );
        if (result.rows.length === 0) {
            const err = new Error(`Feature flag '${key}' not found`);
            err.statusCode = 404;
            throw err;
        }
        return result.rows[0];
    }

    /**
     * Helper to check if a specific flag is enabled (boolean)
     */
    async isEnabled(key) {
        try {
            const flag = await this.getFeatureFlag(key);
            return flag.is_enabled === true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Update feature flag status (Admin)
     */
    async updateFeatureFlag(key, is_enabled) {
        if (typeof is_enabled !== 'boolean') {
            const err = new Error('is_enabled must be a boolean');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            `UPDATE feature_flags 
             SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE key = $2 
             RETURNING *`,
            [is_enabled, key]
        );

        if (result.rows.length === 0) {
            const err = new Error(`Feature flag '${key}' not found`);
            err.statusCode = 404;
            throw err;
        }

        return result.rows[0];
    }
}

module.exports = new FeatureFlagService();
