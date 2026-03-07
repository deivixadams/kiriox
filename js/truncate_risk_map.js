const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();
    try {
        const tableName = 'map_risk_control';

        // Backup
        console.log(`Backing up ${tableName} as _bak_map_risk_control...`);
        await client.query(`DROP TABLE IF EXISTS corpus._bak_map_risk_control;`);
        await client.query(`CREATE TABLE corpus._bak_map_risk_control AS SELECT * FROM corpus.${tableName};`);

        const countBak = await client.query(`SELECT COUNT(*) FROM corpus._bak_map_risk_control;`);
        console.log(`Backup created with ${countBak.rows[0].count} rows.`);

        // Find and drop FKs referencing this table
        const fkRes = await client.query(`
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'corpus'
        AND ccu.table_name = '${tableName}';
    `);
        for (const row of fkRes.rows) {
            console.log(`Dropping FK: ${row.constraint_name} on ${row.table_name}`);
            await client.query(`ALTER TABLE corpus."${row.table_name}" DROP CONSTRAINT "${row.constraint_name}";`);
        }

        // Truncate
        console.log(`\nTruncating ${tableName}...`);
        await client.query(`TRUNCATE TABLE corpus.${tableName};`);
        console.log(`Successfully truncated ${tableName}.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
