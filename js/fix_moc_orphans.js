const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    try {
        const res = await client.query(`
WITH obs AS (
    SELECT id, code FROM corpus_obligation
),
ctrls AS (
    SELECT id, code FROM corpus_control
)
INSERT INTO map_obligation_control (
    obligation_id,
    control_id,
    satisfaction_mode,
    evidence_required,
    min_coverage_threshold,
    regulator_acceptance
)
SELECT
    o.id,
    c.id,
    x.satisfaction_mode,
    x.evidence_required,
    x.min_coverage_threshold,
    x.regulator_acceptance
FROM LATERAL (
VALUES
-- 1. OB_018 (Acceso efectivo a datos AML)
('OB_018', 'C-TE-006', 'DIRECT', true, 0.90, 'HIGH'),
('OB_018', 'C-TE-007', 'INDIRECT', true, 0.85, 'MED'),
('OB_018', 'C-TE-008', 'COMPENSATING', true, 0.70, 'MED'),

-- 2. OB_022 (Gestión conflictos interés OC)
('OB_022', 'C-ST-009', 'DIRECT', true, 1.00, 'HIGH'),
('OB_022', 'C-TE-002', 'INDIRECT', true, 1.00, 'HIGH'),

-- 3. OB_031 (Gobierno modelo y drift)
('OB_031', 'C-TE-010', 'DIRECT', true, 1.00, 'HIGH'),
('OB_031', 'C-TE-012', 'DIRECT', true, 0.95, 'HIGH'),
('OB_031', 'C-TE-009', 'INDIRECT', true, 1.00, 'MED'),

-- 4. OB_032 (Métricas concentración riesgo)
('OB_032', 'C-ST-010', 'DIRECT', true, 0.80, 'HIGH'),

-- 5. OB_046 (Tercerización CDD con controles)
('OB_046', 'C-OP-002', 'DIRECT', true, 1.00, 'HIGH'),
('OB_046', 'C-EX-018', 'INDIRECT', true, 0.90, 'MED'),

-- 6. OB_051 (Medidas reforzadas jurisdicción alto riesgo)
('OB_051', 'C-OP-010', 'DIRECT', true, 1.00, 'HIGH'),
('OB_051', 'C-OP-014', 'INDIRECT', true, 0.85, 'HIGH'),

-- 7. OB_061 (Retroalimentación análisis a riesgo)
('OB_061', 'C-TE-011', 'DIRECT', true, 0.90, 'HIGH'),
('OB_061', 'C-TE-013', 'INDIRECT', true, 0.85, 'MED'),

-- 8. OB_068 (Respaldo y recuperación probada)
('OB_068', 'C-TE-015', 'DIRECT', true, 1.00, 'HIGH'),

-- 9. OB_069 (Atención requerimientos autoridad) - EXISTENTIAL (MUST BE DIRECT+HIGH)
('OB_069', 'C-OP-020', 'DIRECT', true, 1.00, 'HIGH'),
('OB_069', 'C-EX-013', 'DIRECT', true, 1.00, 'HIGH'),
('OB_069', 'C-TE-004', 'INDIRECT', true, 0.70, 'MED')

) AS x(ob_code, ctrl_code, satisfaction_mode, evidence_required, min_coverage_threshold, regulator_acceptance)
JOIN obs o ON o.code = x.ob_code
JOIN ctrls c ON c.code = x.ctrl_code;
    `);

        console.log('Successfully inserted missing map_obligation_control mappings!');
        console.log('Inserted rows:', res.rowCount);
    } catch (err) {
        console.error('Error executing insert:', err.message);
    } finally {
        await client.end();
    }
}

run();
