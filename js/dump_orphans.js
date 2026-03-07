const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
  await client.connect();
  await client.query('SET search_path TO corpus');

  const orphansQuery = `
    SELECT 'OBLIGATION' as type, id, code, title
    FROM corpus_obligation 
    WHERE NOT EXISTS (SELECT 1 FROM map_obligation_control m WHERE m.obligation_id = corpus_obligation.id)
    UNION ALL
    SELECT 'CONTROL' as type, id, code, name as title
    FROM corpus_control 
    WHERE NOT EXISTS (SELECT 1 FROM map_obligation_control m WHERE m.control_id = corpus_control.id)
    ORDER BY type DESC, code ASC;
  `;

  const res = await client.query(orphansQuery);
  console.table(res.rows);
  await client.end();
}

run();
