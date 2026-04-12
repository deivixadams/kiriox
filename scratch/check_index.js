
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query(`
            SELECT t.relname as table_name, i.relname as index_name
            FROM pg_index x
            JOIN pg_class c ON c.oid = x.indrelid
            JOIN pg_class i ON i.oid = x.indexrelid
            JOIN pg_class t ON t.oid = x.indrelid
            WHERE i.relname = 'significant_activity_pkey'
        `);
        console.log('Index belongs to table:', res.rows);
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await client.end();
    }
}

main();
