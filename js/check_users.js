const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL.replace(/\?schema=\w+/, '') });

async function main() {
    try {
        await client.connect();
        const res = await client.query('SELECT u.email, r.role_code FROM security.security_users u LEFT JOIN security.security_rbac r ON u.role_id = r.id');
        console.log('Users and Roles:');
        res.rows.forEach(row => console.log(` - ${row.email}: ${row.role_code || 'NULL'}`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
