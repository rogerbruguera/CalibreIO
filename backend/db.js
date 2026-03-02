require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:adminpassword@127.0.0.1:5433/calibredb';
console.log('Postgres Connection URL Configured:', connectionString.replace(/:([^:@]+)@/, ':***@'));

const pool = new Pool({
  connectionString
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
