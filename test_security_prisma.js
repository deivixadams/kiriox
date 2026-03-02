const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Connection Test ---');
    try {
        const roles = await prisma.securityRbac.findMany();
        console.log(`Successfully fetched ${roles.length} roles.`);
        roles.forEach(r => console.log(` - ${r.roleCode}: ${r.roleName}`));

        const users = await prisma.securityUser.findMany({ take: 5 });
        console.log(`Successfully fetched ${users.length} users.`);
        users.forEach(u => console.log(` - ${u.email} (Role ID: ${u.roleId})`));

    } catch (err) {
        console.error('Error during data fetch:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
