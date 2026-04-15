const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
});

async function main() {
  try {
    await client.connect();
    const reinoId = '539b9089-1187-4a49-9591-6def9cbdd012'; // Administración de inversionistas
    
    // Check domains
    const domainsRes = await client.query('SELECT id, name FROM core.domain WHERE reino_id = $1', [reinoId]);
    console.log('Domains count:', domainsRes.rows.length);

    if (domainsRes.rows.length > 0) {
       const domainIds = domainsRes.rows.map(d => d.id);
       const elementsRes = await client.query('SELECT count(*) FROM core.element WHERE domain_id = ANY($1)', [domainIds]);
       console.log('Elements count:', elementsRes.rows[0].count);
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
