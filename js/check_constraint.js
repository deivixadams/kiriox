const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    const res = await client.query(`
    SELECT pg_get_constraintdef(oid) as constraint_def
    FROM pg_constraint
    WHERE conname = 'evidence_catalog_evidence_type_check';
  `);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

run();
