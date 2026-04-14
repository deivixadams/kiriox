const { Client } = require('pg');

async function checkViews() {
  const client = new Client({
    connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'core'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    await client.end();
  }
}

checkViews();
