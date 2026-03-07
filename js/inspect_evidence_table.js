const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    const res = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'corpus.controltest_evidence_catalog'::regclass;
  `);
    console.log(JSON.stringify(res.rows, null, 2));

    const currentTypes = await client.query(`SELECT DISTINCT evidence_type FROM corpus.controltest_evidence_catalog`);
    console.log('Current types in table:', currentTypes.rows);

    await client.end();
}

run();
