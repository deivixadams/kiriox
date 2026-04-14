const { Client } = require('pg');

async function inspect() {
  const client = new Client({
    connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'core' AND table_name = 'risk'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    await client.end();
  }
}

inspect();
