// Run this script to apply the admin KYC migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = fs.readFileSync(path.join(__dirname, 'database', 'migration_admin_kyc.sql'), 'utf8');

(async () => {
    const client = await pool.connect();
    try {
        console.log('Running admin KYC migration...');
        await client.query(sql);
        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
