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
      SELECT id, nombre, codigo FROM core.domain_elements WHERE nombre ILIKE $1
    `, [`%${searchTerm}%`]);

    if (elemRes.rows.length === 0) {
      console.log('No elements found in core.domain_elements.');
      return;
    }

    for (const element of elemRes.rows) {
      console.log(`\nFound Element: ID=${element.id}, Name="${element.nombre}", Code="${element.codigo}"`);

      // Get risks mapped to this element
      const riskRes = await client.query(`
        SELECT r.id, r.codigo, r.nombre
        FROM core.risk r
        JOIN core.map_elements_risk mer ON r.id = mer.risk_id
        WHERE mer.element_id = $1
      `, [element.id]);

      console.log(`Risks mapped in core.map_elements_risk (Total: ${riskRes.rows.length}):`);
      riskRes.rows.forEach(r => {
        console.log(` - [${r.codigo}] ${r.nombre} (ID: ${r.id})`);
      });

      // Also check if they are mapped via some other table that might be used in Step 2 or 3
      // For example, in Step 2 the user chooses which risks to evaluate.
      // Maybe there's a reason why sometimes 2 and sometimes 3 appear (missing mapping or duplicate?)
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
