const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();
    try {
        // Drop the FK constraint on primary_cf_risk_id
        console.log('Dropping fk_control_primary_cf...');
        await client.query('ALTER TABLE corpus.corpus_control DROP CONSTRAINT IF EXISTS fk_control_primary_cf;');

        // Also check for any triggers that validate the risk type
        const triggers = await client.query(`
      SELECT tgname FROM pg_trigger 
      WHERE tgrelid = 'corpus.corpus_control'::regclass AND NOT tgisinternal;
    `);
        console.log('Triggers:', triggers.rows);

        for (const t of triggers.rows) {
            console.log('Dropping trigger:', t.tgname);
            await client.query(`DROP TRIGGER IF EXISTS "${t.tgname}" ON corpus.corpus_control;`);
        }

        console.log('Done. Ready for insert.');
    } catch (e) { console.error(e.message); }
    finally { await client.end(); }
}
run();
