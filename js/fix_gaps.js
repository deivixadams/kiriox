const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    try {
        const res = await client.query(`
WITH fw AS (
    SELECT '5c613146-37b6-4335-8433-b5c99bee68d6'::uuid AS fw
),
controls AS (
    SELECT id, code FROM corpus_control
),
risks AS (
    SELECT id, code FROM corpus_risk
)
INSERT INTO map_risk_control (
    control_id,
    risk_id,
    mitigation_strength,
    framework_version_id,
    effect_type,
    rationale
)
SELECT
    c.id,
    r.id,
    x.strength,
    fw.fw,
    x.effect_type,
    x.rationale
FROM fw,
LATERAL (
VALUES
-- FIX CRITICAL TERMINAL RISKS
('C-ST-009','RSK_053',4,'detect', 'Auditoría independiente detecta incumplimientos que podrían derivar en responsabilidad penal individual'),
('C-TE-005','RSK_053',4,'evidence', 'Audit trail inmutable provee evidencia para defensa penal institucional'),
('C-OP-019','RSK_054',4,'respond', 'Reporte ROS oportuno permite congelamiento y evita decomiso ampliado'),
('C-TE-005','RSK_054',4,'evidence', 'Trazabilidad AML permite reconstrucción financiera ante investigación'),
('C-ST-012','RSK_057',4,'prevent', 'Remediación estructurada reduce impacto reputacional de fallas AML'),
('C-ST-002','RSK_057',4,'governance', 'Supervisión del directorio fortalece credibilidad institucional'),

-- FIX ORPHAN CONTROLS
('C-EX-010','RSK_017',4,'prevent', 'Prohibición de cuentas anónimas elimina vector primario de lavado'),
('C-EX-011','RSK_017',4,'prevent', 'Prohibición de bancos pantalla elimina intermediarios opacos'),
('C-TE-004','RSK_029',3,'detect', 'Monitoreo de logs detecta accesos indebidos y posible tipping-off'),
('C-TE-009','RSK_012',4,'prevent', 'Versionado de modelos previene drift silencioso del modelo AML'),
('C-TE-011','RSK_012',4,'detect', 'Backtesting identifica degradación del modelo AML'),
('C-TE-015','RSK_012',4,'detect', 'Pruebas técnicas validan correcto funcionamiento del motor AML'),

-- FIX TYPOLOGY SINGLE POINT OF FAILURE
('C-OP-018','RSK_034',3,'respond', 'Investigación estructurada permite confirmar layering detectado'),
('C-OP-018','RSK_036',3,'respond', 'Investigación estructurada permite confirmar conversión rápida de activos'),
('C-OP-018','RSK_037',3,'respond', 'Investigación estructurada permite confirmar integración de fondos'),
('C-OP-018','RSK_038',3,'respond', 'Investigación estructurada permite investigar operaciones TBML')

) AS x(control_code,risk_code,strength,effect_type,rationale)
JOIN controls c ON c.code = x.control_code
JOIN risks r ON r.code = x.risk_code;
    `);

        console.log('Successfully inserted missing mappings!');
        console.log('Inserted rows:', res.rowCount);
    } catch (err) {
        console.error('Error executing insert:', err.message);
    } finally {
        await client.end();
    }
}

run();
