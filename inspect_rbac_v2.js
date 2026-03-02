const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Current Tables Columns ---');
    const userColumns = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'security_users' AND table_schema = 'corpus'`;
    console.log('security_users columns:', userColumns);

    console.log('--- Current SecurityRbac roles ---');
    const roles = await prisma.$queryRaw`SELECT id, role_code, role_name, description FROM corpus.security_rbac`;
    console.log('Roles:', JSON.stringify(roles, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
