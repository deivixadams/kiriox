const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();

    try {
        console.log('Creating backup table corpus._bak_corpus_obligation...');

        // Create backup
        await client.query('DROP TABLE IF EXISTS corpus._bak_corpus_obligation;');
        await client.query('CREATE TABLE corpus._bak_corpus_obligation AS SELECT * FROM corpus.corpus_obligation;');

        console.log('Successfully created backup table corpus._bak_corpus_obligation.');

    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        await client.end();
    }
}

run();
