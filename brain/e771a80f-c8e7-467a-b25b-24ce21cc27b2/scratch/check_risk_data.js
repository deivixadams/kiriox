const { Client } = require('pg');

async function checkData() {
  const client = new Client({
    connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT id, name, catalog_impact_id, catalog_probability_id 
      FROM core.risk 
      ORDER BY updated_at DESC 
      LIMIT 10
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    await client.end();
  }
}

checkData();
