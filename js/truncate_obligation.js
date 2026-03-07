const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();

    try {
        // 1. Find all foreign keys pointing to corpus_obligation
        const query = `
      SELECT 
        tc.table_name, 
        tc.constraint_name 
      FROM 
        information_schema.table_constraints AS tc 
      JOIN 
        information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
      JOIN 
        information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name 
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_schema = 'corpus'
        AND ccu.table_name = 'corpus_obligation';
    `;
        const res = await client.query(query);

        console.log('Found dependent foreign keys:');
        for (const row of res.rows) {
            console.log(`- Table: ${row.table_name}, Constraint: ${row.constraint_name}`);
            await client.query(`ALTER TABLE corpus."${row.table_name}" DROP CONSTRAINT "${row.constraint_name}";`);
            console.log(`  -> Dropped constraint ${row.constraint_name}`);
        }

        // 2. Truncate corpus_obligation
        console.log('\nTruncating corpus_obligation...');
        await client.query('TRUNCATE TABLE corpus.corpus_obligation;');
        console.log('Successfully truncated corpus_obligation.');

    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        await client.end();
    }
}

run();
