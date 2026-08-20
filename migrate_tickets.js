const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting support tickets schema migration...');

        // 1. Create support_tickets table
        await client.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                priority VARCHAR(20) DEFAULT 'Medium',
                status VARCHAR(20) DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created support_tickets table');

        // 2. Index for fast user/status queries
        await client.query(`CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);`);
        console.log('✅ Created indexes for support_tickets');

        console.log('🎉 Support tickets migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
