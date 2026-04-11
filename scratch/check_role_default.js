
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query(`
    SELECT column_name, column_default
    FROM information_schema.columns
    WHERE table_name = 'role'
    AND table_schema = 'security'
    AND column_name = 'id';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
