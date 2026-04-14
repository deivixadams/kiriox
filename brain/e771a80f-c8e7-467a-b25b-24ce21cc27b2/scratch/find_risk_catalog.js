const { Client } = require('pg');

async function inspect() {
  const client = new Client({
    connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name LIKE '%risk_catalog%'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    await client.end();
  }
}

inspect();
