const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    // Block A: C-EX (18 controls) -> EXISTENCE (0.65) + FORMALIZATION (0.35)
    const blockA_Ids = [
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0001', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0002',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0003', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0004',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0005', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0006',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0007', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0008',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0009', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0010',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0011', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0012',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0013', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0014',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0015', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0016',
        'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0017', 'c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0018'
    ];

    // Block B: C-ST (15 controls) -> FORMALIZATION (0.55) + OPERATION (0.45)
    const blockB_Ids = [
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2001', '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2002',
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2003', '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2004',
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2005', '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2006',
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2007', '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2008',
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2009', '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2010',
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2011', '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2012',
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2013', '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2014',
        '5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2015'
    ];

    // Block C: C-OP (20 controls) -> FORMALIZATION (0.35) + OPERATION (0.65)
    const blockC_Ids = [
        'c7f3c1b4-2d1f-4a1e-9c01-101000000001', 'c7f3c1b4-2d1f-4a1e-9c01-101000000002',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000003', 'c7f3c1b4-2d1f-4a1e-9c01-101000000004',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000005', 'c7f3c1b4-2d1f-4a1e-9c01-101000000006',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000007', 'c7f3c1b4-2d1f-4a1e-9c01-101000000008',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000009', 'c7f3c1b4-2d1f-4a1e-9c01-101000000010',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000011', 'c7f3c1b4-2d1f-4a1e-9c01-101000000012',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000013', 'c7f3c1b4-2d1f-4a1e-9c01-101000000014',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000015', 'c7f3c1b4-2d1f-4a1e-9c01-101000000016',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000017', 'c7f3c1b4-2d1f-4a1e-9c01-101000000018',
        'c7f3c1b4-2d1f-4a1e-9c01-101000000019', 'c7f3c1b4-2d1f-4a1e-9c01-101000000020'
    ];

    // Block D: C-TE (15 controls) -> FORMALIZATION (0.40) + OPERATION (0.60)
    const blockD_Ids = [
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000001', '9e1c2c4a-8d7b-4c1a-a1f1-401000000002',
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000003', '9e1c2c4a-8d7b-4c1a-a1f1-401000000004',
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000005', '9e1c2c4a-8d7b-4c1a-a1f1-401000000006',
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000007', '9e1c2c4a-8d7b-4c1a-a1f1-401000000008',
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000009', '9e1c2c4a-8d7b-4c1a-a1f1-401000000010',
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000011', '9e1c2c4a-8d7b-4c1a-a1f1-401000000012',
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000013', '9e1c2c4a-8d7b-4c1a-a1f1-401000000014',
        '9e1c2c4a-8d7b-4c1a-a1f1-401000000015'
    ];

    const dataArr = [];

    // Populate A
    blockA_Ids.forEach(cid => {
        dataArr.push([cid, 'EXISTENCE', 0.65, true, 1.00, true, 'Existencia verificable y aprobación formal']);
        dataArr.push([cid, 'FORMALIZATION', 0.35, true, 0.80, true, 'Versión vigente, control de cambios, owner, vigencia']);
    });

    // Populate B
    blockB_Ids.forEach(cid => {
        dataArr.push([cid, 'FORMALIZATION', 0.55, true, 0.80, true, 'Política/proceso definido, responsabilidades y periodicidad']);
        dataArr.push([cid, 'OPERATION', 0.45, false, 0.70, true, 'Evidencia de ejecución en la práctica (reportes/minutas/seguimiento)']);
    });

    // Populate C
    blockC_Ids.forEach(cid => {
        dataArr.push([cid, 'FORMALIZATION', 0.35, true, 0.70, true, 'Procedimiento definido + criterios + responsables']);
        dataArr.push([cid, 'OPERATION', 0.65, true, 0.80, true, 'Evidencia repetible de ejecución (casos/logs/resultados)']);
    });

    // Populate D
    blockD_Ids.forEach(cid => {
        dataArr.push([cid, 'FORMALIZATION', 0.40, true, 0.75, true, 'Configuración/estándar técnico definido + control de cambios']);
        dataArr.push([cid, 'OPERATION', 0.60, true, 0.80, true, 'Evidencia técnica de ejecución (logs/alertas/resultados) en producción']);
    });

    try {
        const query = 'INSERT INTO controltest_dimension_model (id, control_id, dimension, weight, is_gate, min_dimension_score, evidence_required, evidence_min_spec, is_active, effective_from, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, \'2026-03-05\', \'2026-03-05\', \'2026-03-05\')';

        for (const row of dataArr) {
            await client.query(query, row);
        }

        console.log('Successfully inserted ' + dataArr.length + ' rows into controltest_dimension_model!');
    } catch (err) {
        console.error('Error seeding dimension model:', err.message);
    } finally {
        await client.end();
    }
}

run();
