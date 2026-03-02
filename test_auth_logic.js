const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL.replace(/\?schema=\w+/, '');

async function main() {
    const adapter = new PrismaPg(new Client({ connectionString }));
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('--- Testing getAuthContext Simulation ---');
        const adminUser = await prisma.securityUser.findFirst({
            where: { isActive: true, role: { roleCode: 'ADMIN' } },
            include: { role: true },
            orderBy: { createdAt: 'asc' }
        });

        if (adminUser) {
            console.log('Found ADMIN user:', adminUser.email);
            console.log('Role:', adminUser.role.roleCode);
        } else {
            console.log('NO ADMIN user found with that query.');

            // Try finding any user
            const anyUser = await prisma.securityUser.findFirst({
                include: { role: true }
            });
            console.log('Sample any user:', anyUser?.email, 'Role:', anyUser?.role?.roleCode);
        }
    } catch (err) {
        console.error('Error during simulation:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
