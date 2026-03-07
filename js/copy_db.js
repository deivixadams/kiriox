const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Create the backup table in the corpus schema
    await client.query('DROP TABLE IF EXISTS corpus._bak_corpus_domain;');
    await client.query('CREATE TABLE corpus._bak_corpus_domain AS SELECT * FROM corpus.corpus_domain;');
    
    console.log('Successfully created backup table corpus._bak_corpus_domain from corpus.corpus_domain.');
  } catch (err) {
    console.error('Error during backup:', err);
  } finally {
    await client.end();
  }
}

run();
