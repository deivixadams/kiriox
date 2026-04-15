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
      SELECT * FROM core.domain_elements WHERE name ILIKE $1
    `, [`%${searchTerm}%`]);

    if (elemRes.rows.length === 0) {
      console.log('No elements found in core.domain_elements.');
      return;
    }

    for (const element of elemRes.rows) {
      console.log(`\nFound Element: ID=${element.id}, Name="${element.name}", Code="${element.code}"`);

      // Get risks mapped to this element
      const riskRes = await client.query(`
        SELECT r.id, r.code, r.name
        FROM core.risk r
        JOIN core.map_elements_risk mer ON r.id = mer.risk_id
        WHERE mer.element_id = $1
      `, [element.id]);

      console.log(`Risks mapped in core.map_elements_risk (Total: ${riskRes.rows.length}):`);
      riskRes.rows.forEach(r => {
        console.log(` - [${r.code}] ${r.name} (ID: ${r.id})`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
