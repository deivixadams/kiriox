const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    const searchTerm = 'Actualización de titularidad y registros de participación';
    
    console.log(`Searching for Element: "${searchTerm}"`);
    const elemRes = await client.query(`
      SELECT * FROM core.elemento WHERE nombre ILIKE $1
    `, [`%${searchTerm}%`]);

    if (elemRes.rows.length === 0) {
      console.log('No elements found.');
      return;
    }

    for (const element of elemRes.rows) {
      console.log(`\nFound Element: ID=${element.id}, Name="${element.nombre}", Code="${element.codigo}"`);

      // Get ALL risks mapped to this element
      const riskRes = await client.query(`
        SELECT r.id, r.codigo, r.nombre, r.descripcion
        FROM core.riesgo r
        JOIN core.map_elemento_x_riesgo mer ON r.id = mer.id_riesgo
        WHERE mer.id_elemento = $1
      `, [element.id]);

      console.log(`Risks mapped to this element in core.map_elemento_x_riesgo (Total: ${riskRes.rows.length}):`);
      riskRes.rows.forEach(r => {
        console.log(` - [${r.codigo}] ${r.nombre} (ID: ${r.id})`);
      });

      // Check if there are company-specific mappings or filters
      // Based on previous knowledge, there might be a map_company_x_riesgo or similar
      // Let's check the tables in core schema
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name LIKE 'map%'
      `);
      console.log('\nMapping tables in core schema:');
      tablesRes.rows.forEach(t => console.log(` - ${t.table_name}`));

    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
