const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL.replace(/\?schema=\w+/, '') });

async function main() {
    try {
        await client.connect();
        console.log('Connected to DB.');
        const resUsers = await client.query('SELECT count(*) FROM security.security_users');
        console.log('Users count:', resUsers.rows[0].count);
        const resRoles = await client.query('SELECT count(*) FROM security.security_rbac');
        console.log('Roles count:', resRoles.rows[0].count);
        const resData = await client.query('SELECT email FROM security.security_users LIMIT 1');
        console.log('Sample user:', resData.rows[0]?.email);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
