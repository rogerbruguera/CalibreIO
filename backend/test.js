require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:adminpassword@127.0.0.1:5432/calibredb'
});
client.connect()
  .then(() => {
    console.log('CONNECTED SUCCESSFULLY');
    return client.query('SELECT NOW()');
  })
  .then(res => console.log('TIME:', res.rows[0].now))
  .catch(e => console.error('CONNECTION ERROR:', e.message))
  .finally(() => client.end());
