const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'controltest_test_catalog'
    ORDER BY table_schema, ordinal_position;
  `);
    console.table(res.rows);
    await client.end();
}

run();
