
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting migration via Prisma...');
        await prisma.$executeRawUnsafe(`
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS responsible TEXT;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS frequency TEXT;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS risk_weight DECIMAL;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS cascade_factor DECIMAL;
            ALTER TABLE core.significant_activity ADD COLUMN IF NOT EXISTS is_cascade BOOLEAN DEFAULT FALSE;
        `);
        console.log('Migration SUCCESS');
    } catch (err: any) {
        console.error('Migration FAILED:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
