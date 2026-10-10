// Promote or configure an administrator account with 2FA contact info (Email + Mobile)
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const targetEmail = process.argv[2] ? process.argv[2].trim().toLowerCase() : null;
let targetPhone = process.argv[3] ? process.argv[3].trim() : null;

if (targetPhone && !targetPhone.startsWith('+')) {
    targetPhone = '+91' + targetPhone;
}

(async () => {
    if (!targetEmail) {
        console.error('❌ Usage: node set_admin.js <email> [mobile_phone]');
        console.error('   Example: node set_admin.js admin@domain.com +919876543210\n');
        process.exit(1);
    }

    const client = await pool.connect();
    try {
        // Check if account exists
        let userCheck = await client.query('SELECT id, email, phone, role FROM users WHERE LOWER(email) = LOWER($1)', [targetEmail]);
        let userId;

        if (userCheck.rows.length === 0) {
            console.log(`ℹ️ Account ${targetEmail} not found. Creating new admin user...`);
            const insertResult = await client.query(
                "INSERT INTO users (email, phone, role, status, is_verified) VALUES ($1, $2, 'admin', 'Active', TRUE) RETURNING id, email, phone, role, status",
                [targetEmail, targetPhone]
            );
            userId = insertResult.rows[0].id;
            console.log(`✅ Admin account created: ID: ${userId} | Email: ${targetEmail} | Phone: ${targetPhone || 'None'}`);
        } else {
            userId = userCheck.rows[0].id;
            // If phone is provided, check if another user currently holds it and release it
            if (targetPhone) {
                const rawPhone = targetPhone.replace(/^\+91/, '');
                const conflictCheck = await client.query(
                    'SELECT id, email, role FROM users WHERE (phone = $1 OR phone = $2) AND id != $3',
                    [targetPhone, rawPhone, userId]
                );
                if (conflictCheck.rows.length > 0) {
                    for (const conflict of conflictCheck.rows) {
                        console.log(`ℹ️ Phone was previously linked to User #${conflict.id} (${conflict.email || 'No email'}). Releasing for admin account...`);
                        if (conflict.email) {
                            await client.query('UPDATE users SET phone = NULL WHERE id = $1', [conflict.id]);
                        } else {
                            await client.query('DELETE FROM users WHERE id = $1', [conflict.id]);
                        }
                    }
                }
            }

            // Update existing user
            let updateQuery = "UPDATE users SET role = 'admin', status = 'Active', is_verified = TRUE";
            let params = [];

            if (targetPhone) {
                params.push(targetPhone, userId);
                updateQuery += `, phone = $1 WHERE id = $2 RETURNING id, email, phone, role, status`;
            } else {
                params.push(userId);
                updateQuery += ` WHERE id = $1 RETURNING id, email, phone, role, status`;
            }

            const updateRes = await client.query(updateQuery, params);
            console.log(`✅ Admin account updated successfully:`);
            console.log(`  ID: ${updateRes.rows[0].id} | Email: ${updateRes.rows[0].email} | Phone: ${updateRes.rows[0].phone || 'None'}`);
        }

        // Clean up legacy placeholder if any
        await client.query("DELETE FROM users WHERE email = 'admin@dkart.com'");

        // Display all admin accounts and their 2FA readiness
        const admins = await client.query("SELECT id, email, phone, role, status FROM users WHERE role = 'admin' ORDER BY id ASC");
        console.log('\n======================================================');
        console.log('📋 CURRENT ADMINISTRATOR ACCOUNTS & 2FA STATUS:');
        console.log('======================================================');
        admins.rows.forEach(r => {
            const hasEmail = Boolean(r.email);
            const hasPhone = Boolean(r.phone);
            const ready2Fa = hasEmail && hasPhone;
            console.log(
                `ID: ${r.id.toString().padEnd(4)} | Email: ${(r.email || 'None').padEnd(28)} | Phone: ${(r.phone || 'None').padEnd(16)} | 2FA: ${ready2Fa ? '✅ READY' : '⚠️ INCOMPLETE (needs ' + (!hasEmail ? 'email' : 'phone') + ')'}`
            );
        });
        console.log('======================================================\n');

    } catch (err) {
        console.error('❌ Database error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
