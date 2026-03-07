const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

(async () => {
    await c.connect();
    // Find all constraints on corpus_control
    const r = await c.query(`
    SELECT conname, pg_get_constraintdef(oid) as def 
    FROM pg_constraint 
    WHERE conrelid = 'corpus.corpus_control'::regclass;
  `);
    console.log('All constraints on corpus_control:');
    for (const row of r.rows) {
        console.log(`  ${row.conname}: ${row.def}`);
    }
    await c.end();
})();
