const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const rows = [
    ['da0c0d91-5a05-445c-a881-0265d4d420a4', '4392879b-918e-41e4-86f8-f3720e8284cf', 'DIRECT', true, 0.8, 'HIGH'],
    ['da0c0d91-5a05-445c-a881-0265d4d420a4', '14f6bb0d-b6d5-482c-be45-09600f92bbba', 'DIRECT', true, 0.7, 'HIGH'],
    ['61f3824e-c6db-4dec-a70e-124988bd0533', 'a0076fee-b1e2-4254-a794-8bcf45e6f125', 'DIRECT', true, 1.0, 'HIGH'],
];

async function run() {
    await client.connect();
    let count = 0;
    for (const r of rows) {
        await client.query(`
      INSERT INTO corpus.map_obligation_control 
        (control_id, obligation_id, satisfaction_mode, evidence_required, min_coverage_threshold, regulator_acceptance, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (control_id, obligation_id) 
      DO UPDATE SET satisfaction_mode = $3, min_coverage_threshold = $5, regulator_acceptance = $6, updated_at = NOW();
    `, r);
        count++;
    }
    const total = await client.query('SELECT COUNT(*) FROM corpus.map_obligation_control;');
    console.log('Inserted/updated:', count, '| Total:', total.rows[0].count);
    await client.end();
}
run();
