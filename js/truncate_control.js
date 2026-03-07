const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();
    try {
        // 1. Find FK constraints referencing corpus_control
        const fkRes = await client.query(`
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'corpus'
        AND ccu.table_name = 'corpus_control';
    `);
        console.log(`Found ${fkRes.rows.length} FK constraints referencing corpus_control:`);
        for (const row of fkRes.rows) {
            console.log(`  - ${row.table_name}.${row.constraint_name}`);
            await client.query(`ALTER TABLE corpus."${row.table_name}" DROP CONSTRAINT "${row.constraint_name}";`);
            console.log(`    Dropped.`);
        }

        // 2. Truncate
        console.log('\nTruncating corpus_control...');
        await client.query('TRUNCATE TABLE corpus.corpus_control CASCADE;');
        console.log('Truncated.');

        const count = await client.query('SELECT COUNT(*) FROM corpus.corpus_control;');
        console.log(`Row count: ${count.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
run();
