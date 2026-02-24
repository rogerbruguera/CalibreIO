require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:adminpassword@127.0.0.1:5433/calibredb'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
