const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const searchTerm = 'Actualización de titularidad y registros de participación';
  
  // Search in Elemento
  const elementos = await prisma.$queryRawUnsafe(`
    SELECT * FROM core.elemento WHERE nombre ILIKE $1
  `, `%${searchTerm}%`);
  
  console.log('Elementos found:', elementos);

  for (const element of elementos) {
    // Find risks associated with this element
    const risks = await prisma.$queryRawUnsafe(`
      SELECT r.* 
      FROM core.riesgo r
      JOIN core.map_elemento_x_riesgo mer ON r.id = mer.id_riesgo
      WHERE mer.id_elemento = $1
    `, element.id);
    
    console.log(`Risks for Element ID ${element.id} (${element.nombre}):`, risks.length);
    risks.forEach(r => console.log(` - ID: ${r.id}, Name: ${r.nombre}`));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
