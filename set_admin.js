// Promote an existing account to admin based on command-line argument
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const targetEmail = process.argv[2];

(async () => {
    if (!targetEmail) {
        console.error('❌ Please provide an email address. Example: node set_admin.js myemail@example.com');
        process.exit(1);
    }

    const client = await pool.connect();
    try {
        // Promote existing account
        const result = await client.query(
            "UPDATE users SET role = 'admin', status = 'Active', is_verified = TRUE WHERE email = $1 RETURNING id, email, role, status",
            [targetEmail]
        );

        if (result.rows.length === 0) {
            console.log(`❌ Account with email ${targetEmail} not found. Please register first.`);
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
