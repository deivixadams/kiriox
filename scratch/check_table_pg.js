const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
});

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'risk_treatment'
    `);
    console.log('Tables found:', res.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
