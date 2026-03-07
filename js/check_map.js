const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();
    try {
        // Check table structure
        const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'corpus' AND table_name = 'map_risk_control'
      ORDER BY ordinal_position;
    `);
        console.log('Columns:', cols.rows);
    } catch (e) { console.error(e); }
    finally { await client.end(); }
}
run();
