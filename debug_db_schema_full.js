const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/cre_db"
});

async function run() {
    await client.connect();
    const tables = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('framework_version', 'corpus_framework', 'profile', 'parameter_definition', 'profile_parameter_value');
  `);

    const constraints = await client.query(`
    SELECT 
        tc.table_schema, 
        tc.table_name, 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND (tc.table_name IN ('framework_version', 'corpus_framework') OR ccu.table_name IN ('framework_version', 'corpus_framework'));
  `);

    const result = {
        tables: tables.rows,
        constraints: constraints.rows
    };

    fs.writeFileSync('db_debug_result.json', JSON.stringify(result, null, 2));
    await client.end();
}
run();
