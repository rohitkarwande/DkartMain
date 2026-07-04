const db = require('./db');

// Initialize the table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS cache_store (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiry BIGINT NOT NULL
  )
`).catch(err => console.error("Failed to create cache_store table:", err));

const redisClient = {
    setEx: async (key, seconds, value) => {
        const expiry = Date.now() + seconds * 1000;
        await db.query(
            `INSERT INTO cache_store (key, value, expiry) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (key) DO UPDATE SET value = $2, expiry = $3`,
            [key, String(value), expiry]
        );
        return 'OK';
    },
    get: async (key) => {
        const result = await db.query(
            `SELECT value, expiry FROM cache_store WHERE key = $1`,
            [key]
        );
        if (result.rows.length === 0) return null;
        
        const item = result.rows[0];
        if (Date.now() > Number(item.expiry)) {
            await db.query(`DELETE FROM cache_store WHERE key = $1`, [key]);
            return null;
        }
        return item.value;
    },
    del: async (key) => {
        await db.query(`DELETE FROM cache_store WHERE key = $1`, [key]);
        return 1;
    }
};

module.exports = redisClient;
