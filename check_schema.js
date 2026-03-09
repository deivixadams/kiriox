const { Client } = require('pg');
const fs = require('fs');

async function checkDatabaseSchema() {
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@localhost:5432/cre_db"
    });

    try {
        await client.connect();

        const result = {};
        const tables = ['profile', 'parameter_definition', 'profile_parameter_value', 'change_log'];

        for (const table of tables) {
            const columnsRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'params' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

            result[table] = columnsRes.rows;
        }

        fs.writeFileSync('db_schema_output.json', JSON.stringify(result, null, 2));
        console.log('Results written to db_schema_output.json');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkDatabaseSchema();
