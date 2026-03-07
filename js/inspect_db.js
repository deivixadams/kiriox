const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Current Users and Roles ---');
    const users = await prisma.$queryRaw`SELECT id, email, role_code FROM corpus.security_users LIMIT 10`;
    console.log('Users sample:', users);

    const roles = await prisma.$queryRaw`SELECT id, role_code, permission_code FROM corpus.security_rbac`;
    console.log('Current SecurityRbac roles:', roles);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
