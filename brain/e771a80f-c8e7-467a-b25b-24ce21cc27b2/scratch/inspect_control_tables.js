const { Client } = require('pg');

async function getTables() {
  const client = new Client({
    connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
  });
  await client.connect();
  try {
    const tables = ['control', 'map_risk_control'];
    for (const table of tables) {
      console.log(`--- Table: core.${table} ---`);
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'core' AND table_name = '${table}'
        ORDER BY ordinal_position
      `);
      console.log(JSON.stringify(res.rows, null, 2));
    }

    console.log(`--- Table: security.security_users ---`);
    const resUsers = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'security' AND table_name = 'security_users'
      ORDER BY ordinal_position
    `);
    console.log(JSON.stringify(resUsers.rows, null, 2));

  } finally {
    await client.end();
  }
}

getTables();
