const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const client = await pool.connect();
    try {
        console.log('Running user_profiles migration...');
        
        await client.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS profession VARCHAR(100),
            ADD COLUMN IF NOT EXISTS location VARCHAR(150);
        `);
        
        console.log('✅ Migration completed successfully! The profession and location columns were added to user_profiles.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
