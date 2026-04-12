
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query('SELECT * FROM core.significant_activity LIMIT 1');
        console.log('Query success! Row count:', res.rows.length);
        console.log('Columns:', Object.keys(res.rows[0] || {}));
    } catch (err) {
        console.error('Query FAILED:', err.message);
    } finally {
        await client.end();
    }
}

main();
