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
        console.log('Starting migration for Banner & Product Views/Clicks analytics...');

        // 1. Ensure engagement_metrics has click_count
        await client.query(`
            ALTER TABLE engagement_metrics 
            ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
        `);
        console.log('✅ Added click_count to engagement_metrics');

        // 2. Ensure hero_banners has metrics and relational columns
        await client.query(`
            ALTER TABLE hero_banners 
            ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS equipment_post_id UUID REFERENCES equipment_posts(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS promotion_id INTEGER REFERENCES promotions(id) ON DELETE SET NULL;
        `);
        console.log('✅ Added views_count, clicks_count, seller_id, equipment_post_id, promotion_id to hero_banners');

        // 3. Ensure promotions table has views and clicks columns for direct reporting
        await client.query(`
            ALTER TABLE promotions
            ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;
        `);
        console.log('✅ Added views_count and clicks_count to promotions');

        // 4. Backfill any hero_banners linking to /equipment/<id>
        await client.query(`
            UPDATE hero_banners hb
            SET equipment_post_id = ep.id,
                seller_id = ep.seller_id
            FROM equipment_posts ep
            WHERE hb.equipment_post_id IS NULL
              AND hb.link_url LIKE '/equipment/' || ep.id::text || '%';
        `);

        // If any banner was created from a promotion, link it
        await client.query(`
            UPDATE hero_banners hb
            SET promotion_id = p.id,
                seller_id = COALESCE(hb.seller_id, p.seller_id),
                equipment_post_id = COALESCE(hb.equipment_post_id, p.equipment_post_id)
            FROM promotions p
            WHERE hb.promotion_id IS NULL
              AND hb.equipment_post_id = p.equipment_post_id
              AND p.type = 'carousel';
        `);
        console.log('✅ Backfilled relationship links on hero_banners');

        await client.query('COMMIT');
        console.log('🎉 Migration finished successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
