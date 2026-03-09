const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/cre_db"
});

async function run() {
    try {
        await client.connect();

        // Populate profile info
        await client.query("UPDATE params.profile SET info = 'Perfil de configuración estándar para entorno de producción' WHERE is_official = true;");
        await client.query("UPDATE params.profile SET info = 'Configuración experimental para pruebas de estrés' WHERE is_official = false;");

        // Populate parameter definition info
        await client.query("UPDATE params.parameter_definition SET info = 'Este parámetro define el umbral crítico para la exposición de riesgo.' WHERE code = 'THRESHOLD_CRITICAL';");
        await client.query("UPDATE params.parameter_definition SET info = 'Factor multiplicador para el cálculo de severidad base.' WHERE data_type_code = 'NUMERIC';");

        console.log("Datos de prueba poblados con éxito.");
    } catch (err) {
        console.error("Error al poblar datos:", err);
    } finally {
        await client.end();
    }
}
run();
