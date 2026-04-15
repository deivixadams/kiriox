const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
});

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT reino_id, count(*) as count 
      FROM views._v_graph_failure_impact 
      GROUP BY reino_id
    `);
    console.log('Reino ID distribution:', res.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
