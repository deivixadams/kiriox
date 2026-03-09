const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/cre_db"
});

async function run() {
    await client.connect();
    const res = await client.query("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'");
    console.log(JSON.stringify(res.rows.map(r => r.nspname), null, 2));
    await client.end();
}
run();
