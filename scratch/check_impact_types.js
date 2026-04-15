const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
});

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT failed_node_type, count(*) as count 
      FROM views._v_graph_failure_impact 
      GROUP BY failed_node_type
    `);
    console.log('Failure impact types:', res.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
