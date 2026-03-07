const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const risks = [
    // STRUCTURAL (risk_type_id=1, risk_layer_id=1)
    { code: 'RSK_001', name: 'Inexistencia del programa AML', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_002', name: 'Gobierno AML ineficaz', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_003', name: 'Programa AML desactualizado', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_004', name: 'Apetito AML no operable', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_005', name: 'Función de cumplimiento sin independencia', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_006', name: 'Acceso deficiente a datos AML', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_007', name: 'RBA técnico defectuoso', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_008', name: 'Subestimación del riesgo institucional', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_009', name: 'Segmentación de riesgo incorrecta', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_010', name: 'Evaluación insuficiente de nuevos productos', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_011', name: 'Triggers riesgo→acción no ejecutados', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_012', name: 'Drift del modelo no gestionado', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_013', name: 'Gestión deficiente de terceros AML', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_014', name: 'Testing independiente ineficaz', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_015', name: 'Gestión de remediación ineficaz', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },
    { code: 'RSK_016', name: 'Calidad e integración de datos AML defectuosa', risk_type: 'STRUCTURAL', status: 'active', status_id: 1, risk_type_id: 1, risk_layer_id: 1 },

    // PRIMARY / OPERATIONAL (risk_type_id=2, risk_layer_id=2)
    { code: 'RSK_017', name: 'Onboarding sin identificación válida', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_018', name: 'KYC insuficiente', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_019', name: 'Beneficiario final no identificado', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_020', name: 'EDD no aplicada cuando corresponde', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_021', name: 'PEP no detectado', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_022', name: 'Screening de sanciones ineficaz', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_023', name: 'Congelamiento no ejecutado', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_024', name: 'Monitoreo transaccional insuficiente', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_025', name: 'Cobertura de monitoreo incompleta', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_026', name: 'Investigación no reproducible', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_027', name: 'Decisión sospecha/no sospecha defectuosa', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_028', name: 'Reporte a autoridad tardío o incompleto', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_029', name: 'Tipping-off o confidencialidad deficiente', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_030', name: 'Integridad y retención de evidencia insuficiente', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },
    { code: 'RSK_031', name: 'Indisponibilidad de información ante autoridad', risk_type: 'PRIMARY', status: 'active', status_id: 1, risk_type_id: 2, risk_layer_id: 2 },

    // TYPOLOGY (risk_type_id=3, risk_layer_id=3)
    { code: 'RSK_032', name: 'Colocación mediante efectivo o equivalentes', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_033', name: 'Estructuración / smurfing', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_034', name: 'Estratificación transaccional (layering)', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_035', name: 'Mezcla de fondos lícitos e ilícitos', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_036', name: 'Conversión rápida de activos', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_037', name: 'Integración en economía formal', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_038', name: 'Lavado basado en comercio (TBML)', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_039', name: 'Abuso de corresponsalía bancaria', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_040', name: 'Flujos transfronterizos opacos', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_041', name: 'Arbitraje regulatorio', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_042', name: 'Abuso de canales digitales de alta velocidad', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_043', name: 'Abuso de estructuras fiduciarias', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_044', name: 'Abuso de vehículos corporativos', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_045', name: 'Uso de terceros o nominees', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_046', name: 'Opacidad de beneficiario final', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },
    { code: 'RSK_047', name: 'Colusión interna o externa', risk_type: 'TYPOLOGY', status: 'active', status_id: 1, risk_type_id: 3, risk_layer_id: 3 },

    // TERMINAL (risk_type_id=4, risk_layer_id=4)
    { code: 'RSK_048', name: 'Multa administrativa significativa', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_049', name: 'Sanción administrativa grave', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_050', name: 'Suspensión o revocación de licencia', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_051', name: 'Inhabilitación de directivos', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_052', name: 'Responsabilidad penal institucional', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_053', name: 'Responsabilidad penal individual', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_054', name: 'Decomiso de activos', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_055', name: 'Pérdida de corresponsalías bancarias', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_056', name: 'Supervisión intensiva prolongada', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_057', name: 'Daño reputacional severo', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_058', name: 'Riesgo sistémico institucional', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
    { code: 'RSK_059', name: 'Colapso estructural del sistema AML', risk_type: 'TERMINAL', status: 'active', status_id: 1, risk_type_id: 4, risk_layer_id: 4 },
];

async function run() {
    await client.connect();
    let insertCount = 0;

    try {
        for (const r of risks) {
            const query = `
        INSERT INTO corpus.corpus_risk (
          code, name, risk_type, status, status_id, risk_type_id, risk_layer_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `;
            const values = [r.code, r.name, r.risk_type, r.status, r.status_id, r.risk_type_id, r.risk_layer_id];
            await client.query(query, values);
            console.log(`Inserted: ${r.code} - ${r.name}`);
            insertCount++;
        }

        console.log(`\nSuccessfully inserted ${insertCount} risks into corpus.corpus_risk.`);

        const finalCount = await client.query('SELECT COUNT(*) FROM corpus.corpus_risk;');
        console.log(`Total risks in table: ${finalCount.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
