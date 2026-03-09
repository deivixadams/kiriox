const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/cre_db"
});

async function run() {
    try {
        await client.connect();
        console.log("Conectado a la base de datos...");

        const queries = [
            "ALTER TABLE params.profile ADD COLUMN IF NOT EXISTS info TEXT;",
            "ALTER TABLE params.parameter_definition ADD COLUMN IF NOT EXISTS info TEXT;",
            "ALTER TABLE params.profile_parameter_value ADD COLUMN IF NOT EXISTS info TEXT;"
        ];

        for (const sql of queries) {
            console.log(`Ejecutando: ${sql}`);
            await client.query(sql);
        }

        console.log("Columnas 'info' agregadas con éxito.");
    } catch (err) {
        console.error("Error al modificar la base de datos:", err);
    } finally {
        await client.end();
    }
}
run();
