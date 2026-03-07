const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    try {
        // 1. Backup map_obligation_control
        console.log('Creating backup _bak_map_obligation_control...');
        await client.query('DROP TABLE IF EXISTS _bak_map_obligation_control;');
        await client.query('CREATE TABLE _bak_map_obligation_control AS SELECT * FROM map_obligation_control;');
        console.log('Backup created successfully.');

        // 2. Drop constraints to allow truncate if needed
        console.log('Dropping constraints on map_obligation_control...');

        // Check constraints
        const checks = await client.query(`
      SELECT conname FROM pg_constraint 
      WHERE conrelid = 'corpus.map_obligation_control'::regclass AND contype = 'c'
    `);
        for (const row of checks.rows) {
            console.log(`Dropping Check Constraint: ${row.conname}`);
            await client.query(`ALTER TABLE map_obligation_control DROP CONSTRAINT "${row.conname}";`);
        }

        // FK Constraints
        const fks = await client.query(`
      SELECT conname FROM pg_constraint 
      WHERE conrelid = 'corpus.map_obligation_control'::regclass AND contype = 'f'
    `);
        for (const row of fks.rows) {
            console.log(`Dropping FK Constraint: ${row.conname}`);
            await client.query(`ALTER TABLE map_obligation_control DROP CONSTRAINT "${row.conname}";`);
        }

        // 3. Truncate
        console.log('Truncating map_obligation_control...');
        await client.query('TRUNCATE TABLE map_obligation_control CASCADE;');
        console.log('Truncate successful.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
