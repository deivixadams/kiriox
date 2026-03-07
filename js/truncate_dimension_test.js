const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    try {
        // 1. Find all constraints for the table
        const constraintsRes = await client.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      JOIN pg_class ON pg_class.oid = pg_constraint.conrelid 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
      WHERE relname = 'controltest_dimension_test' 
        AND nspname = 'corpus';
    `);

        console.log('Constraints found:', constraintsRes.rows.length);

        // 2. Drop each constraint
        for (const row of constraintsRes.rows) {
            try {
                console.log(`Dropping constraint: ${row.conname}`);
                await client.query(`ALTER TABLE controltest_dimension_test DROP CONSTRAINT "${row.conname}"`);
            } catch (e) {
                console.warn(`Could not drop ${row.conname}: ${e.message}`);
            }
        }

        // 3. Truncate table with CASCADE
        console.log('Truncating table controltest_dimension_test CASCADE...');
        await client.query('TRUNCATE TABLE controltest_dimension_test CASCADE');

        console.log('Successfully truncated controltest_dimension_test (CASCADE) and removed constraints.');

    } catch (err) {
        console.error('Error during truncation:', err.message);
    } finally {
        await client.end();
    }
}

run();
