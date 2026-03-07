const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

(async () => {
    await c.connect();

    // Drop ALL remaining constraints except PK and UNIQUE
    const r = await c.query(`
    SELECT conname, contype FROM pg_constraint 
    WHERE conrelid = 'corpus.corpus_control'::regclass AND contype = 'f'
  `);
    for (const row of r.rows) {
        console.log('Dropping FK:', row.conname);
        await c.query(`ALTER TABLE corpus.corpus_control DROP CONSTRAINT IF EXISTS "${row.conname}";`);
    }
    console.log('All FK constraints on corpus_control dropped.');
    await c.end();
})();
