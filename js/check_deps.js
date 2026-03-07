const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();
    try {
        const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'corpus' AND table_name = 'corpus_obligation_dependencies';
    `;
        const res = await client.query(query);
        console.log('Columns for corpus_obligation_dependencies:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
