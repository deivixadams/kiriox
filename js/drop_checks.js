const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

(async () => {
    await c.connect();

    // Drop ALL check constraints on corpus_control
    const r = await c.query(`
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'corpus.corpus_control'::regclass AND contype = 'c'
  `);
    for (const row of r.rows) {
        console.log('Dropping check constraint:', row.conname);
        await c.query(`ALTER TABLE corpus.corpus_control DROP CONSTRAINT "${row.conname}";`);
    }
    console.log('All check constraints dropped. Ready for insert.');
    await c.end();
})();
