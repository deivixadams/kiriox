const prisma = require('./src/infrastructure/db/prisma/client').default;

async function main() {
  console.log('Model exists:', !!prisma.risk_treatment);
  if (prisma.risk_treatment) {
    console.log('Fields:', Object.keys(prisma.risk_treatment));
  }
}

main().catch(console.error);
