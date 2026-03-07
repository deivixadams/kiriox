const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
    await client.connect();

    try {
        // 1. Drop foreign key constraint from corpus_obligation to corpus_domain
        console.log('Dropping foreign key corpus_obligation_domain_id_fkey from corpus_obligation...');
        await client.query(`
      ALTER TABLE corpus.corpus_obligation 
      DROP CONSTRAINT IF EXISTS corpus_obligation_domain_id_fkey;
    `);
        console.log('Foreign key dropped.');

        // 2. Truncate corpus_domain
        console.log('Truncating corpus_domain...');
        await client.query('TRUNCATE TABLE corpus.corpus_domain CASCADE;');
        console.log('Successfully truncated corpus_domain.');

    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        await client.end();
    }
}

run();
