const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL.replace(/\?schema=\w+/, '');

async function main() {
    const adapter = new PrismaPg(new Client({ connectionString }));
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('--- Testing API Query (Users) ---');
        const users = await prisma.securityUser.findMany({
            select: {
                id: true,
                email: true,
                role: {
                    select: {
                        roleCode: true,
                        roleName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log('Successfully fetched users count:', users.length);
        if (users.length > 0) {
            console.log('First user role:', users[0].role?.roleCode);
        }

        console.log('\n--- Testing API Query (Roles) ---');
        const roles = await prisma.securityRbac.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
        });
        console.log('Successfully fetched roles count:', roles.length);

    } catch (err) {
        console.error('CRITICAL QUERY ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
