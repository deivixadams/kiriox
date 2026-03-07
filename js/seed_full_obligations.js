const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const obligations = [
    { code: 'OB_001', domain_code: 'DOM_01', title: 'Adopción formal Programa AML', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_002', domain_code: 'DOM_01', title: 'Aprobación por órgano administración', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_003', domain_code: 'DOM_01', title: 'Versionado formal del Programa AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_004', domain_code: 'DOM_01', title: 'Asignación recursos suficientes', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_005', domain_code: 'DOM_01', title: 'Definición apetito riesgo AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_006', domain_code: 'DOM_01', title: 'Supervisión periódica del programa', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.6, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_007', domain_code: 'DOM_01', title: 'Programa AML consolidado grupo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.5, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_008', domain_code: 'DOM_01', title: 'Régimen disciplinario AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.4, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_009', domain_code: 'DOM_01', title: 'Código ética con enforcement', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.4, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_010', domain_code: 'DOM_01', title: 'Capacitación AML por rol', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.4, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_011', domain_code: 'DOM_01', title: 'Evaluación efectividad capacitación', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_012', domain_code: 'DOM_01', title: 'Gestión centralizada hallazgos', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_013', domain_code: 'DOM_01', title: 'Gestión formal excepciones AML', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.1, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_014', domain_code: 'DOM_01', title: 'Gestión cambio con evaluación riesgo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.7, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_015', domain_code: 'DOM_02', title: 'Designación formal Oficial Cumplimiento', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_016', domain_code: 'DOM_02', title: 'Independencia funcional OC', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_017', domain_code: 'DOM_02', title: 'Acceso directo órgano administración', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_018', domain_code: 'DOM_02', title: 'Acceso efectivo a datos AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_019', domain_code: 'DOM_02', title: 'Facultad detener onboarding', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.2, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_020', domain_code: 'DOM_02', title: 'Protección funcional OC', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_021', domain_code: 'DOM_02', title: 'Continuidad operativa rol OC', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_022', domain_code: 'DOM_02', title: 'Gestión conflictos interés OC', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.1, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_023', domain_code: 'DOM_03', title: 'Metodología RBA formal versionada', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_024', domain_code: 'DOM_03', title: 'Evaluación institucional riesgo periódica', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_025', domain_code: 'DOM_03', title: 'Segmentación clientes trazable', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_026', domain_code: 'DOM_03', title: 'Evaluación riesgo productos', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_027', domain_code: 'DOM_03', title: 'Evaluación riesgo canales', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_028', domain_code: 'DOM_03', title: 'Evaluación riesgo jurisdiccional', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_029', domain_code: 'DOM_03', title: 'Evaluación nuevos productos', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_030', domain_code: 'DOM_03', title: 'Triggers riesgo→acción', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_031', domain_code: 'DOM_03', title: 'Gobierno modelo y drift', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.3, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_032', domain_code: 'DOM_03', title: 'Métricas concentración riesgo', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_033', domain_code: 'DOM_04', title: 'Identificación cliente previa onboarding', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_034', domain_code: 'DOM_04', title: 'Verificación identidad cliente', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_035', domain_code: 'DOM_04', title: 'Identificación beneficiario final', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_036', domain_code: 'DOM_04', title: 'Verificación beneficiario final', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_037', domain_code: 'DOM_04', title: 'Propósito y naturaleza relación', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.7, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_038', domain_code: 'DOM_04', title: 'Perfil económico cliente', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_039', domain_code: 'DOM_04', title: 'Fuente fondos por riesgo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_040', domain_code: 'DOM_04', title: 'EDD alto riesgo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.2, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_041', domain_code: 'DOM_04', title: 'Detección y clasificación PEP', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_042', domain_code: 'DOM_04', title: 'Prohibición cuentas anónimas', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_043', domain_code: 'DOM_04', title: 'Prohibición bancos pantalla', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_044', domain_code: 'DOM_04', title: 'No relación sin CDD completa', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_045', domain_code: 'DOM_04', title: 'Mantenimiento KYC por triggers', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_046', domain_code: 'DOM_04', title: 'Tercerización CDD con controles', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.7, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_047', domain_code: 'DOM_05', title: 'Screening listas sanciones', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_048', domain_code: 'DOM_05', title: 'Gestión hit con cadena custodia', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.2, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_049', domain_code: 'DOM_05', title: 'Congelamiento inmediato activos', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_050', domain_code: 'DOM_05', title: 'Bloqueo provisión fondos', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.2, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_051', domain_code: 'DOM_05', title: 'Medidas reforzadas jurisdicción alto riesgo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_052', domain_code: 'DOM_06', title: 'Monitoreo transaccional basado riesgo', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_053', domain_code: 'DOM_06', title: 'Cobertura monitoreo justificada', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_054', domain_code: 'DOM_06', title: 'Gestión alertas y casos trazable', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_055', domain_code: 'DOM_06', title: 'Investigación reproducible', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_056', domain_code: 'DOM_06', title: 'Decisión sospecha documentada', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_057', domain_code: 'DOM_06', title: 'Reporte ROS plazo legal', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_058', domain_code: 'DOM_06', title: 'Reporte ROS intentadas', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_059', domain_code: 'DOM_06', title: 'Reporte transacciones efectivo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_060', domain_code: 'DOM_06', title: 'Prohibición tipping-off', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_061', domain_code: 'DOM_06', title: 'Retroalimentación análisis a riesgo', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_062', domain_code: 'DOM_07', title: 'Retención registros 10 años', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_063', domain_code: 'DOM_07', title: 'Disponibilidad inmediata autoridades', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_064', domain_code: 'DOM_07', title: 'Integridad e inalterabilidad información', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.2, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_065', domain_code: 'DOM_07', title: 'Control acceso IAM AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_066', domain_code: 'DOM_07', title: 'Logs auditoría sistemas AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_067', domain_code: 'DOM_07', title: 'Seguridad información AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_068', domain_code: 'DOM_07', title: 'Respaldo y recuperación probada', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_069', domain_code: 'DOM_08', title: 'Atención requerimientos autoridad', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_070', domain_code: 'DOM_08', title: 'Procedimientos cooperación legal', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.7, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_071', domain_code: 'DOM_09', title: 'Cumplimiento medidas correctivas supervisor', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },

    { code: 'OB_072', domain_code: 'DOM_10', title: 'Prohibición participación LA/FT', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true }
];

async function run() {
    await client.connect();
    let insertCount = 0;

    try {
        // Truncate the table safely
        console.log('Truncating corpus_obligation again...');
        await client.query('TRUNCATE TABLE corpus.corpus_obligation;');
        console.log('Successfully truncated corpus_obligation.');

        const domainRes = await client.query('SELECT code, id FROM corpus.corpus_domain;');
        const domainMap = {};
        domainRes.rows.forEach(r => domainMap[r.code] = r.id);

        let criticalityId = 3;
        let evidenceStrengthId = 3;

        try {
            const critRes = await client.query('SELECT id FROM corpus.corpus_catalog_criticality LIMIT 1;');
            if (critRes.rows.length > 0) criticalityId = critRes.rows[0].id;

            const evRes = await client.query('SELECT id FROM corpus.corpus_catalog_evidence_strength LIMIT 1;');
            if (evRes.rows.length > 0) evidenceStrengthId = evRes.rows[0].id;
        } catch (e) {
            console.log('Could not find ids, using fallbacks', e);
        }

        for (const ob of obligations) {
            const domainId = domainMap[ob.domain_code];

            if (!domainId) {
                console.warn(`Warning: Domain code ${ob.domain_code} not found in DB for obligation ${ob.code}`);
                continue;
            }

            const rationaleData = JSON.stringify({
                structural_level: ob.structural_level,
                risk_weight: ob.risk_weight,
                cascade_factor: ob.cascade_factor,
                is_dependency_root: ob.is_dependency_root
            });

            const query = `
        INSERT INTO corpus.corpus_obligation (
          domain_id, code, title, statement, rationale, is_hard_gate, 
          criticality, evidence_strength, criticality_id, evidence_strength_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id;
      `;
            let customCrit = 3;
            if (ob.structural_level === 'EXISTENTIAL') customCrit = 1;
            else if (ob.structural_level === 'CRITICAL') customCrit = 2;
            else if (ob.structural_level === 'ROBUSTNESS') customCrit = 3;
            else if (ob.structural_level === 'MATURITY') customCrit = 4;

            const statement = `Obligation regarding ${ob.title}`;

            const values = [
                domainId,
                ob.code,
                ob.title,
                statement,
                rationaleData,
                ob.is_hard_gate,
                customCrit,
                evidenceStrengthId,
                customCrit,
                evidenceStrengthId
            ];

            await client.query(query, values);
            console.log(`Inserted obligation: ${ob.code} - ${ob.title}`);
            insertCount++;
        }

        console.log(`\nSuccessfully inserted ${insertCount} obligations into corpus.corpus_obligation.\n`);

        const finalCount = await client.query('SELECT COUNT(*) FROM corpus.corpus_obligation;');
        console.log(`Total obligations in table: ${finalCount.rows[0].count}`);

    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        await client.end();
    }
}

run();
