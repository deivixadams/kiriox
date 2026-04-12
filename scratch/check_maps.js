
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'core' AND table_name LIKE 'map_%'
        `);
        console.log('Mapping tables found:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await client.end();
    }
}

main();
