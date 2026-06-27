const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync(path.join(__dirname, 'database', 'migration_deal_tracking.sql'), 'utf8');

(async () => {
    const client = await pool.connect();
    try {
        console.log('Running deal tracking migration...');
        await client.query(sql);
        console.log('✅ Deal tracking migration completed!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
