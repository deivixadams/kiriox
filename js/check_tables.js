const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();
    try {
        const query = `
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'corpus';
    `;
        const res = await client.query(query);
        console.log('Tables in corpus schema:', res.rows.map(r => r.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
