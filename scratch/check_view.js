
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
            FROM information_schema.views 
            WHERE table_schema = 'views' AND table_name = 'empresa_reino_dominio_elementos'
        `);
        console.log('View found:', res.rows.length > 0);
        if (res.rows.length > 0) {
            const cols = await client.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_schema = 'views' AND table_name = 'empresa_reino_dominio_elementos'
            `);
            console.log('Columns:', cols.rows.map(r => r.column_name));
        }
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await client.end();
    }
}

main();
