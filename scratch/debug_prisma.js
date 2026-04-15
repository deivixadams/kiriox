const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();

async function main() {
    const props = Object.keys(client);
    console.log('Props:', props.filter(p => !p.startsWith('_')));
    console.log('risk_treatment:', !!client.risk_treatment);
    console.log('riskTreatment:', !!client.riskTreatment);
}

main().catch(console.error);
