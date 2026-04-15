const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Client } = require('pg');

async function main() {
  const connectionString = "postgresql://postgres:kiriox@localhost:5432/kiriox_db";
  const client = new Client({ connectionString });
  await client.connect();
  
  // Minimal mock for repository logic
  async function run(code) {
    console.log(`\nTesting Question: ${code}`);
    const res = await client.query('SELECT code, question, graph_design FROM core.main_question WHERE code = $1', [code]);
    const question = res.rows[0];
    if (!question) { console.log('Question not found'); return; }
    
    const text = `${question.code} ${question.question}`.toLowerCase();
    const focus = String(question.graph_design?.focus || question.graph_design?.focus_type || '').toLowerCase();
    console.log('Detected Focus:', focus);
    console.log('Text check "dominio":', text.includes('dominio'));
  }

  await run('G01');
  await run('Q01');
  await client.end();
}

main();
