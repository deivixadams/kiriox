const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();

    try {
        // 1. Check current catalog values
        console.log('=== Current corpus_catalog_risk_type ===');
        const rtRes = await client.query('SELECT * FROM corpus.corpus_catalog_risk_type ORDER BY id;');
        console.log(rtRes.rows);

        console.log('\n=== Current corpus_catalog_risk_layer ===');
        const rlRes = await client.query('SELECT * FROM corpus.corpus_catalog_risk_layer ORDER BY id;');
        console.log(rlRes.rows);

        console.log('\n=== Current corpus_risk count ===');
        const countRes = await client.query('SELECT COUNT(*) FROM corpus.corpus_risk;');
        console.log('Count:', countRes.rows[0].count);

        // 2. Backup corpus_risk
        console.log('\nCreating backup _bak_corpus_risk...');
        await client.query('DROP TABLE IF EXISTS corpus._bak_corpus_risk;');
        await client.query('CREATE TABLE corpus._bak_corpus_risk AS SELECT * FROM corpus.corpus_risk;');
        console.log('Backup created.');

        // 3. Find all FK constraints pointing to corpus_risk
        console.log('\n=== FK constraints referencing corpus_risk ===');
        const fkRes = await client.query(`
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'corpus'
        AND ccu.table_name = 'corpus_risk';
    `);
        for (const row of fkRes.rows) {
            console.log(`- Table: ${row.table_name}, Constraint: ${row.constraint_name}`);
        }

        // 4. Drop FK constraints
        for (const row of fkRes.rows) {
            await client.query(`ALTER TABLE corpus."${row.table_name}" DROP CONSTRAINT "${row.constraint_name}";`);
            console.log(`Dropped: ${row.constraint_name}`);
        }

        // 5. Truncate corpus_risk
        console.log('\nTruncating corpus_risk...');
        await client.query('TRUNCATE TABLE corpus.corpus_risk CASCADE;');
        console.log('Truncated corpus_risk.');

        // 6. Update catalog tables to match new structure
        // corpus_catalog_risk_type: 1=STRUCTURAL, 2=OPERATIONAL, 3=TYPOLOGY, 4=TERMINAL
        console.log('\nUpdating corpus_catalog_risk_type...');
        await client.query('TRUNCATE TABLE corpus.corpus_catalog_risk_type CASCADE;');
        await client.query(`
      INSERT INTO corpus.corpus_catalog_risk_type (id, code, name, sort_order, is_active) VALUES
      (1, 'STRUCTURAL', 'Structural', 1, true),
      (2, 'OPERATIONAL', 'Operational', 2, true),
      (3, 'TYPOLOGY', 'Typology', 3, true),
      (4, 'TERMINAL', 'Terminal', 4, true);
    `);
        console.log('Updated corpus_catalog_risk_type.');

        // corpus_catalog_risk_layer: 1=STRUCTURAL, 2=OPERATIONAL, 3=TYPOLOGY, 4=TERMINAL
        console.log('\nUpdating corpus_catalog_risk_layer...');
        await client.query('TRUNCATE TABLE corpus.corpus_catalog_risk_layer CASCADE;');
        await client.query(`
      INSERT INTO corpus.corpus_catalog_risk_layer (id, code, name, sort_order, is_active) VALUES
      (1, 'STRUCTURAL', 'Structural', 1, true),
      (2, 'OPERATIONAL', 'Operational', 2, true),
      (3, 'TYPOLOGY', 'Typology', 3, true),
      (4, 'TERMINAL', 'Terminal', 4, true);
    `);
        console.log('Updated corpus_catalog_risk_layer.');

        // 7. Verify
        console.log('\n=== Final corpus_catalog_risk_type ===');
        const rtFinal = await client.query('SELECT * FROM corpus.corpus_catalog_risk_type ORDER BY id;');
        console.log(rtFinal.rows);

        console.log('\n=== Final corpus_catalog_risk_layer ===');
        const rlFinal = await client.query('SELECT * FROM corpus.corpus_catalog_risk_layer ORDER BY id;');
        console.log(rlFinal.rows);

        console.log('\nDone! corpus_risk is now empty and ready for new data with the updated structure.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
