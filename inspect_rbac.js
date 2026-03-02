const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus"
        }
    }
});

async function main() {
    console.log('--- Deep RBAC Inspection ---');
    const counts = await prisma.$queryRaw`
    SELECT role_code, COUNT(*), array_agg(id) as ids 
    FROM corpus.security_rbac 
    GROUP BY role_code 
    HAVING COUNT(*) > 1
  `;
    console.log('Duplicate role_codes:', JSON.stringify(counts, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));

    const allRoles = await prisma.$queryRaw`SELECT id, role_code FROM corpus.security_rbac`;
    console.log('All roles:', allRoles);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
