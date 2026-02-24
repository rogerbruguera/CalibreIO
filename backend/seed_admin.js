const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    try {
        const hash = await bcrypt.hash('password123', 10);
        await pool.query(
            `INSERT INTO users (email, password_hash, role) VALUES ('admin@calibre.cat', $1, 'admin') ON CONFLICT DO NOTHING`,
            [hash]
        );
        console.log('Seeded admin@calibre.cat successfully');
    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        process.exit(0);
    }
}

seed();
