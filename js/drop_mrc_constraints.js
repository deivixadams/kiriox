const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });
(async () => {
    await c.connect();
    // Drop all check constraints on map_risk_control
    const r = await c.query(`
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'corpus.map_risk_control'::regclass AND contype = 'c'
  `);
    for (const row of r.rows) {
        console.log('Dropping:', row.conname);
        await c.query(`ALTER TABLE corpus.map_risk_control DROP CONSTRAINT "${row.conname}";`);
    }
    // Also drop FK constraints on map_risk_control
    const fks = await c.query(`
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'corpus.map_risk_control'::regclass AND contype = 'f'
  `);
    for (const row of fks.rows) {
        console.log('Dropping FK:', row.conname);
        await c.query(`ALTER TABLE corpus.map_risk_control DROP CONSTRAINT "${row.conname}";`);
    }
    console.log('All constraints dropped on map_risk_control.');
    await c.end();
})();
