
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_name IN ('security_users', 'role')
    AND table_schema = 'security';
  `;
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
