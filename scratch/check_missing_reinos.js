const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
});

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, name FROM core.reino 
      WHERE id IN ('706e297e-4e1d-45bc-a294-0a404eeddf46', '993c14b3-0fa8-4a02-9959-d3850e32a34e')
    `);
    console.log('Missing reinos:', res.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
