const db = require('./config/db');

async function migrate() {
    try {
        console.log('Running contact_messages table migration...');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                subject VARCHAR(250) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Resolved')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('contact_messages table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
