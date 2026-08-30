/**
 * Migration: Paid Promotions Controls
 * Adds paid_promotions_enabled to users table and seeds global feature flag.
 * Run: node migrate_paid_promotions_rules.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add paid_promotions_enabled column to users
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS paid_promotions_enabled BOOLEAN DEFAULT FALSE;
        `);
        console.log('✅ Added paid_promotions_enabled column to users table');

        // 2. Seed feature flag
        await client.query(`
            INSERT INTO feature_flags (key, is_enabled, name, description)
            VALUES (
                'enable_paid_promotions', 
                FALSE, 
                'Paid Promotions', 
                'Enables paid promotion features across the site globally'
            )
            ON CONFLICT (key) DO NOTHING;
        `);
        console.log('✅ Seeded enable_paid_promotions feature flag');

        await client.query('COMMIT');
        console.log('\n🎉 Paid promotions control migration completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(() => process.exit(1));
