const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus'
});

const obligations = [
    { code: 'OB_001', domain_code: 'DOM_01', title: 'Programa AML Formal', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_002', domain_code: 'DOM_02', title: 'Designación Oficial de Cumplimiento', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_003', domain_code: 'DOM_04', title: 'Prohibición Onboarding sin Identificación', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_004', domain_code: 'DOM_05', title: 'Congelamiento sin Demora', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_005', domain_code: 'DOM_06', title: 'Reporte Operación Sospechosa', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_006', domain_code: 'DOM_07', title: 'Retención Legal Registros', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_007', domain_code: 'DOM_08', title: 'Atención Requerimientos Autoridad', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.0, is_dependency_root: true, is_hard_gate: true },
    { code: 'OB_008', domain_code: 'DOM_10', title: 'Prohibición Participación LA/FT', structural_level: 'EXISTENTIAL', risk_weight: 100, cascade_factor: 3.5, is_dependency_root: true, is_hard_gate: true },

    { code: 'OB_009', domain_code: 'DOM_03', title: 'Metodología RBA Formal', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_010', domain_code: 'DOM_04', title: 'Identificación Beneficiario Final', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.8, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_011', domain_code: 'DOM_06', title: 'Monitoreo Transaccional Basado en Riesgo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.2, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_012', domain_code: 'DOM_01', title: 'Auditoría Externa AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.6, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_013', domain_code: 'DOM_01', title: 'Capacitación AML Permanente', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.4, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_014', domain_code: 'DOM_01', title: 'Régimen Disciplinario AML', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.4, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_015', domain_code: 'DOM_04', title: 'Fuente de Fondos por Riesgo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.7, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_016', domain_code: 'DOM_06', title: 'Reporte Transacciones en Efectivo', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 1.9, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_017', domain_code: 'DOM_05', title: 'Screening Listas Sanciones', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.1, is_dependency_root: true, is_hard_gate: false },
    { code: 'OB_018', domain_code: 'DOM_07', title: 'Integridad e Inalterabilidad Información', structural_level: 'CRITICAL', risk_weight: 70, cascade_factor: 2.0, is_dependency_root: true, is_hard_gate: false },

    { code: 'OB_019', domain_code: 'DOM_03', title: 'Evaluación Riesgo Nuevos Productos', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_020', domain_code: 'DOM_03', title: 'Segmentación y Rating Trazables', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.1, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_021', domain_code: 'DOM_06', title: 'Gestión Trazable de Alertas y Casos', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_022', domain_code: 'DOM_07', title: 'Seguridad Información AML', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_023', domain_code: 'DOM_01', title: 'Gestión Centralizada de Hallazgos', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.1, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_024', domain_code: 'DOM_03', title: 'Gobierno del Modelo y Drift', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.2, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_025', domain_code: 'DOM_06', title: 'Retroalimentación al Riesgo', structural_level: 'ROBUSTNESS', risk_weight: 40, cascade_factor: 1.1, is_dependency_root: false, is_hard_gate: false },

    { code: 'OB_026', domain_code: 'DOM_01', title: 'Reporte Ejecutivo Consolidado', structural_level: 'MATURITY', risk_weight: 20, cascade_factor: 1.0, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_027', domain_code: 'DOM_01', title: 'Apetito de Riesgo AML Formalizado', structural_level: 'MATURITY', risk_weight: 20, cascade_factor: 1.0, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_028', domain_code: 'DOM_07', title: 'Respaldo y Recuperación Probada', structural_level: 'MATURITY', risk_weight: 20, cascade_factor: 1.0, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_029', domain_code: 'DOM_06', title: 'SLAs por Severidad', structural_level: 'MATURITY', risk_weight: 20, cascade_factor: 1.0, is_dependency_root: false, is_hard_gate: false },
    { code: 'OB_030', domain_code: 'DOM_04', title: 'Mantenimiento KYC por Triggers', structural_level: 'MATURITY', risk_weight: 20, cascade_factor: 1.1, is_dependency_root: false, is_hard_gate: false },
];

async function run() {
    await client.connect();
    let insertCount = 0;

    try {
        // We need to fetch the mappings of domain_code to domain_id
        const domainRes = await client.query('SELECT code, id FROM corpus.corpus_domain;');
        const domainMap = {};
        domainRes.rows.forEach(r => domainMap[r.code] = r.id);

        // Some fields like structural_level, risk_weight, cascade_factor, is_dependency_root might not be in the direct table depending on schema. Let's map it.
        // Let's look at schema.prisma definition for CorpusObligation:
        /*
          id  (UUID default uuid)
          domainId (UUID maps to domainMap)
          code (String)
          title (String)
          statement (String) - We will use the title as statement placeholder
          source_ref (String)
          rationale (String)
          status (String default active)
          criticality (Int default 3)
          evidenceStrength (Int default 3)
          criticalityId (Int)
          evidence_strength_id (Int)
          is_hard_gate (Boolean default false)
        */

        // Let's resolve criticalityId by looking at corpus_catalog_criticality, and evidence_strength_id at corpus_catalog_evidence_strength
        // Since we don't know the IDs, we can define dummy ones or look them up. Assuming ID=3 is a safe default based on "default 3" in schema
        // Let's query one from catalog just to be safe.
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

            // We will map structural_level and other new fields into the "rationale" or "statement" fields as JSON metadata if they are not in schema
            // Since they sent "cascade_factor", "is_dependency_root" those are clearly domain-specific terms maybe meant to be stored in "rationale" for now to not lose them, or we just insert what fits the current schema.
            // Based on the Prisma schema, we don't have fields for risk_weight, cascade_factor, is_dependency_root, or structural_level directly in corpus_obligation table. 
            // The schema HAS: 'is_hard_gate' (Boolean). Let's use it.
            // For the rest, we can pack them in "rationale"

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
            // We will map structural_level to criticality logic (EXISTENTIAL=1, CRITICAL=2, ROBUSTNESS=3, MATURITY=4 roughly)
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
                customCrit, // criticality
                evidenceStrengthId, // evidence_strength
                customCrit, // criticality_id
                evidenceStrengthId // evidence_strength_id
            ];

            await client.query(query, values);
            console.log(`Inserted obligation: ${ob.code} - ${ob.title}`);
            insertCount++;
        }

        console.log(`\nSuccessfully inserted ${insertCount} obligations into corpus.corpus_obligation.`);

    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        await client.end();
    }
}

run();
