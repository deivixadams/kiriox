const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
});

async function main() {
  try {
    await client.connect();
    const reinoId = '539b9089-1187-4a49-9591-6def9cbdd012'; // Administración de inversionistas
    
    const nodesRes = await client.query(`
      SELECT count(*) FROM views._v_graph_nodes_master WHERE reino_id = $1
    `, [reinoId]);
    console.log('Nodes for target reino:', nodesRes.rows[0].count);

    const impactRes = await client.query(`
      SELECT count(*) FROM views._v_graph_failure_impact WHERE reino_id = $1
    `, [reinoId]);
    console.log('Impact data for target reino:', impactRes.rows[0].count);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
