
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query(`
            SELECT n.nspname as schema, c.relname as name, c.relkind as kind
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname LIKE '%significant_activity%'
        `);
        console.log('Results:', res.rows);
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await client.end();
    }
}

main();
