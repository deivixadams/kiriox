
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query(`
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_name IN ('process', 'process_category')
    AND table_schema = 'core';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
