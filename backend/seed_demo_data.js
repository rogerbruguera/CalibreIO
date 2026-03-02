const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function generateDemoData() {
    try {
        console.log('Connecting to database...');

        // 1. Get the admin user UUID
        const userRes = await pool.query(`SELECT id FROM users WHERE email = 'admin'`);
        if (userRes.rowCount === 0) {
            console.error('Admin user not found! Please run seed_admin.js first.');
            process.exit(1);
        }
        const adminId = userRes.rows[0].id;
        console.log(`Found admin user: ${adminId}`);

        // 2. Ensure "demo" producer user exists
        let demoId;
        const demoRes = await pool.query(`SELECT id FROM users WHERE email = 'demo'`);
        if (demoRes.rowCount === 0) {
            console.log('Creating demo producer user...');
            const hash = await bcrypt.hash('demo', 10);
            const insertRes = await pool.query(
                `INSERT INTO users (email, password_hash, role) VALUES ('demo', $1, 'producer') RETURNING id`,
                [hash]
            );
            demoId = insertRes.rows[0].id;
        } else {
            demoId = demoRes.rows[0].id;
        }
        console.log(`Found/Created demo user: ${demoId}`);

        const usersToSeed = [
            { id: adminId, prefix: 'Camp' },
            { id: demoId, prefix: 'Finca Demo' }
        ];

        const varieties = ['Gala', 'Fuji', 'Golden'];
        const startingSizes = { 'Gala': 40, 'Fuji': 45, 'Golden': 42 };

        console.log('\n--- Checking Catalog Varieties ---');
        for (const variety of varieties) {
            try {
                await pool.query(
                    `INSERT INTO apple_varieties (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
                    [variety]
                );
            } catch (varErr) {
                console.error(`Error inserting variety ${variety}:`, varErr);
            }
        }

        for (const user of usersToSeed) {
            console.log(`\n--- Generating data for User ID: ${user.id} ---`);
            const fieldsData = [];

            // --- Creatings Fields ---
            for (const variety of varieties) {
                for (let i = 1; i <= 3; i++) {
                    const fieldName = `${user.prefix} ${variety} 0${i}`;
                    console.log(`Creating field: ${fieldName}...`);
                    const fieldRes = await pool.query(
                        `INSERT INTO fields (name, variety, area, tree_type, planting_year, user_id) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                        [
                            fieldName,
                            variety,
                            (Math.random() * (5.5 - 1.2) + 1.2).toFixed(2),
                            'Estatxa Central',
                            Math.floor(Math.random() * (2022 - 2015 + 1)) + 2015,
                            user.id
                        ]
                    );
                    fieldsData.push({ id: fieldRes.rows[0].id, variety });
                }
            }

            // --- Generating Size Controls (Last 10 Weeks) ---
            const today = new Date();

            for (const field of fieldsData) {
                console.log(`Generating 10 weeks of measurements for Field ID: ${field.id}...`);
                let currentBaseSize = startingSizes[field.variety] + (Math.random() * 4 - 2);

                for (let weekOffset = 9; weekOffset >= 0; weekOffset--) {
                    const measureDate = new Date(today);
                    measureDate.setDate(today.getDate() - (weekOffset * 7));

                    // add random growth between 2.5 and 4.2mm
                    currentBaseSize += (Math.random() * (4.2 - 2.5) + 2.5);

                    const measurements = [];
                    let totalSize = 0;
                    for (let s = 0; s < 10; s++) {
                        const appleSize = Number((currentBaseSize + (Math.random() * 6 - 3)).toFixed(1));
                        measurements.push(appleSize);
                        totalSize += appleSize;
                    }

                    const averageSize = Number((totalSize / 10).toFixed(2));
                    const dateStr = measureDate.toISOString().split('T')[0];

                    await pool.query(
                        `INSERT INTO size_controls (field_id, user_id, date, average_size, sample_size, measurements, notes)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            field.id,
                            user.id,
                            dateStr,
                            averageSize,
                            10,
                            JSON.stringify(measurements),
                            `Mesura rutinària setmana ${10 - weekOffset}.`
                        ]
                    );
                }
            }
        }

        console.log('\n✅ Demo data generated successfully for ALL users!');

    } catch (err) {
        console.error('Error generating demo data:', err);
    } finally {
        process.exit(0);
    }
}

generateDemoData();
