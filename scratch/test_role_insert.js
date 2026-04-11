
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  try {
    const res = await client.query(`
      INSERT INTO security.role (code, name, description, is_active)
      VALUES ('TEST_ROLE', 'Test Role', 'Test', true)
      RETURNING id
    `);
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('Failure:', err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
