const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('Listing all tables in the database:');
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);
    
    res.rows.forEach(r => {
      console.log(`${r.table_schema}.${r.table_name}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
