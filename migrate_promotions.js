/**
 * Migration: Paid Promotions System
 * Creates promotion_plans and promotions tables, and seeds default plans.
 * Run: node migrate_promotions.js
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

        // 1. Add media_type column to equipment_images (for video support)
        await client.query(`
            ALTER TABLE equipment_images
            ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image';
        `);
        console.log('✅ Added media_type column to equipment_images');

        // 2. Create promotion_plans table
        await client.query(`
            CREATE TABLE IF NOT EXISTS promotion_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL CHECK (type IN ('sponsored', 'carousel')),
                price DECIMAL(10,2) NOT NULL,
                duration_days INTEGER NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created promotion_plans table');

        // 3. Create promotions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS promotions (
                id SERIAL PRIMARY KEY,
                seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                equipment_post_id UUID REFERENCES equipment_posts(id) ON DELETE CASCADE,
                plan_id INTEGER REFERENCES promotion_plans(id),
                type VARCHAR(50) NOT NULL CHECK (type IN ('sponsored', 'carousel')),
                status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Expired', 'Rejected')),
                starts_at TIMESTAMP WITH TIME ZONE,
                expires_at TIMESTAMP WITH TIME ZONE,
                payment_reference VARCHAR(255),
                admin_note TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created promotions table');

        // 4. Indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_promotions_equipment_post_id ON promotions(equipment_post_id);
            CREATE INDEX IF NOT EXISTS idx_promotions_seller_id ON promotions(seller_id);
            CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
            CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);
            CREATE INDEX IF NOT EXISTS idx_promotions_expires_at ON promotions(expires_at);
        `);
        console.log('✅ Created promotion indexes');

        // 5. Seed default promotion plans
        await client.query(`
            INSERT INTO promotion_plans (name, type, price, duration_days, description) VALUES
            ('7-Day Sponsored Listing', 'sponsored', 499, 7, 'Your listing appears at the top of search results with a "Sponsored" badge for 7 days.'),
            ('30-Day Sponsored Listing', 'sponsored', 1499, 30, 'Your listing appears at the top of search results with a "Sponsored" badge for 30 days.'),
            ('7-Day Hero Carousel Feature', 'carousel', 999, 7, 'Your product is featured as a slide in the homepage hero carousel for 7 days.'),
            ('30-Day Hero Carousel Feature', 'carousel', 2999, 30, 'Your product is featured as a slide in the homepage hero carousel for 30 days.')
            ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Seeded default promotion plans');

        await client.query('COMMIT');
        console.log('\n🎉 Promotions migration completed successfully!');
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
