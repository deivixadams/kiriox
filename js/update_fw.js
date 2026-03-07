const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });
(async () => {
    await c.connect();
    const r = await c.query("UPDATE corpus.map_risk_control SET framework_version_id = '5c613146-37b6-4335-8433-b5c99bee68d6'");
    console.log('Updated:', r.rowCount, 'rows');
    await c.end();
})();
