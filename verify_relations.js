const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL.replace(/\?schema=\w+/, '');

async function main() {
    const adapter = new PrismaPg(new Client({ connectionString }));
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('--- Testing SecurityUser Relations ---');
        const user = await prisma.securityUser.findFirst({
            where: { isActive: true },
            include: {
                role: true,
                user_x_rbac: {
                    include: {
                        role: true
                    }
                }
            }
        });

        console.log('Successfully queried SecurityUser!');
        console.log('Relations found:', {
            hasRole: !!user?.role,
            rolesCount: user?.user_x_rbac?.length || 0
        });

    } catch (err) {
        console.error('VERIFICATION ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
