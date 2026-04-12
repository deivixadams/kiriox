
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        for (const table of ['map_company_x_reino', 'map_reino_domain', 'map_domain_element']) {
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'core' AND table_name = '${table}'
            `);
            console.log(`Columns for ${table}:`, res.rows.map(r => r.column_name));
        }
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await client.end();
    }
}

main();
