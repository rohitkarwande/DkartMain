const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const client = await pool.connect();
    try {
        console.log('Running final missing column migration...');
        await client.query('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;');
        console.log('✅ Migration completed successfully! The age column has been added to user_profiles.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
