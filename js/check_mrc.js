const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });
(async () => {
    await c.connect();
    const r = await c.query(`
    SELECT conname, pg_get_constraintdef(oid) as def 
    FROM pg_constraint 
    WHERE conrelid = 'corpus.map_risk_control'::regclass AND contype = 'c'
  `);
    r.rows.forEach(x => console.log(x.conname, ':', x.def));
    await c.end();
})();
