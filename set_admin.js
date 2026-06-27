// Promote existing rohitkarwande82@gmail.com account to admin
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const client = await pool.connect();
    try {
        // Promote existing account
        const result = await client.query(
            "UPDATE users SET role = 'admin', status = 'Active', is_verified = TRUE WHERE email = 'rohitkarwande82@gmail.com' RETURNING id, email, role, status"
        );

        if (result.rows.length === 0) {
            console.log('❌ Account not found. Try with phone number instead.');
        } else {
            console.log('✅ Admin promoted:');
            result.rows.forEach(r => console.log(`  ID: ${r.id} | Email: ${r.email} | Role: ${r.role}`));
        }

        // Also clean up the placeholder if it exists
        await client.query("DELETE FROM users WHERE email = 'admin@dkart.com'");

        // Show all admins
        const admins = await client.query("SELECT id, email, phone, role FROM users WHERE role = 'admin'");
        console.log('\nAll admin accounts:');
        admins.rows.forEach(r => console.log(`  ID: ${r.id} | ${r.email || r.phone} | Role: ${r.role}`));

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
