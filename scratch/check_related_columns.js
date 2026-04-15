const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:kiriox@localhost:5432/kiriox_db"
});

async function main() {
  try {
    await client.connect();
    const tables = ['risk_treatment_action', 'risk_treatment_responsible', 'risk_treatment_evidence'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'core' AND table_name = '${table}'
      `);
      console.log(`Columns for ${table}:`, res.rows.map(r => r.column_name));
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
