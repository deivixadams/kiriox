
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE '%significant_activity%'
        `);
        console.log('Tables found:', res.rows);

        // Try to add columns
        console.log('Attempting migration...');
        await client.query(`
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS responsible TEXT;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS frequency TEXT;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS risk_weight DECIMAL;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS cascade_factor DECIMAL;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS is_cascade BOOLEAN DEFAULT FALSE;
        `);
        console.log('Migration SUCCESS');
    } catch (err) {
        console.error('Migration FAILED:', err.message);
    } finally {
        await client.end();
    }
}

main();
