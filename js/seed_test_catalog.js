const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    const tests = [
        {
            code: 'CT-T01',
            title: 'Política/Programa aprobado y vigente',
            objective: 'Verificar existencia, aprobación formal, vigencia y control de versión de políticas/programas.',
            procedure_text: 'Revisar que el documento exista, esté aprobado por la autoridad competente, tenga versión/fecha/vigencia, responsable, y evidencia de adopción. Confirmar que la versión vigente es la aplicada.',
            parameters_schema: {
                review_type: "documentary",
                requires_approval: true,
                requires_versioning: true,
                min_fields: ["version", "approved_at", "approved_by", "owner"],
                evidence_hint: ["POLICY", "APPROVAL"]
            },
            owner_role: 'Compliance'
        },
        {
            code: 'CT-T02',
            title: 'Procedimiento documentado y mantenido',
            objective: 'Verificar procedimientos documentados, consistencia operativa y trazabilidad de cambios.',
            procedure_text: 'Validar existencia del procedimiento/guía, control de cambios, registro de revisiones, y evidencia de aplicación (tickets/bitácoras/audit trail).',
            parameters_schema: {
                review_type: "documentary",
                check_change_control: true,
                min_fields: ["owner", "last_reviewed_at"],
                checks: ["exists", "current_version", "change_log", "applied_in_practice"],
                evidence_hint: ["PROCEDURE", "POLICY", "TICKET", "AUDIT_TRAIL"]
            },
            owner_role: 'Compliance'
        },
        {
            code: 'CT-T03',
            title: 'Designación formal de rol crítico',
            objective: 'Verificar nombramiento, autoridad, alcance y responsabilidades de roles críticos (p.ej., Oficial de Cumplimiento).',
            procedure_text: 'Confirmar evidencia formal del nombramiento (acta/carta), autoridad delegada, alcance, independencia (si aplica) y vigencia.',
            parameters_schema: {
                review_type: "documentary",
                min_fields: ["appointed_at", "appointed_by", "scope", "authority"],
                checks: ["appointment_exists", "scope_defined", "authority_defined", "validity"],
                evidence_hint: ["ROLE_LETTER", "APPROVAL"]
            },
            owner_role: 'Board'
        },
        {
            code: 'CT-T04',
            title: 'Independencia, segregación y acceso a gobierno',
            objective: 'Verificar independencia funcional, segregación de funciones y acceso directo a instancias de gobierno.',
            procedure_text: 'Revisar organigrama, líneas de reporte, matriz SoD y evidencia de acceso directo (agendas/minutas/reportes).',
            parameters_schema: {
                review_type: "governance",
                checks: ["independence", "SoD", "direct_access"],
                evidence_hint: ["ORG_CHART", "POLICY", "APPROVAL", "AUDIT_TRAIL"]
            },
            owner_role: 'Board'
        },
        {
            code: 'CT-T05',
            title: 'Gobernanza y reporte periódico',
            objective: 'Verificar supervisión activa, reportes recurrentes, decisiones y seguimiento del órgano de gobierno.',
            procedure_text: 'Confirmar reportes con frecuencia definida, minutas/decisiones, seguimiento de acciones y evidencia de escalamiento cuando aplica.',
            parameters_schema: {
                review_type: "governance",
                checks: ["periodic_reporting", "minutes_decisions", "action_tracking", "escalation"],
                evidence_hint: ["REPORT_SUBMISSION", "AUDIT_TRAIL", "APPROVAL"]
            },
            owner_role: 'Board'
        },
        {
            code: 'CT-T06',
            title: 'RBA: metodología y evaluación periódica',
            objective: 'Verificar enfoque basado en riesgo: metodología formal y evaluaciones periódicas con aprobación y plan.',
            procedure_text: 'Revisar metodología (variables/scoring/periodicidad), última evaluación institucional (alcance/hallazgos/acciones) y evidencia de aprobación.',
            parameters_schema: {
                review_type: "risk",
                requires_methodology: true,
                requires_periodic_eval: true,
                checks: ["methodology_defined", "eval_current", "action_plan", "approval"],
                evidence_hint: ["PROCEDURE", "REPORT_SUBMISSION", "APPROVAL"]
            },
            owner_role: 'Risk'
        },
        {
            code: 'CT-T07',
            title: 'Regla obligatoria con bloqueo (hard-stop)',
            objective: 'Verificar que el proceso/sistema impida avanzar sin requisitos críticos (ID, BO, KYC mínimo, propósito).',
            procedure_text: 'Revisar configuración/reglas y evidencia de ejecución (logs). Probar casos: falta de campo crítico -> bloqueo; cumplimiento -> avance.',
            parameters_schema: {
                review_type: "technical",
                test_mode: "positive_negative_cases",
                requires_system_rule: true,
                test_cases: ["missing_critical_field_blocks", "complete_allows_progress"],
                evidence_hint: ["SYSTEM_CONFIG", "SYSTEM_LOG", "SCREENSHOT"]
            },
            owner_role: 'KYC'
        },
        {
            code: 'CT-T08',
            title: 'EDD: diligencia reforzada y aprobación',
            objective: 'Verificar que EDD se aplique cuando corresponde y exista workflow obligatorio de aprobación con trazabilidad.',
            procedure_text: 'Muestrear casos alto riesgo: validar gatillos, checklist EDD, aprobaciones, y eventos del workflow.',
            parameters_schema: {
                review_type: "operational",
                sampling: true,
                default_sample_size: 20,
                checks: ["triggering", "edd_steps_complete", "approval", "workflow_traceability"],
                evidence_hint: ["CASE_FILE", "WORKFLOW_EVENT", "APPROVAL", "AUDIT_TRAIL"]
            },
            owner_role: 'Compliance'
        },
        {
            code: 'CT-T09',
            title: 'Screening de sanciones y manejo de coincidencias',
            objective: 'Verificar screening, periodicidad/cobertura y manejo de hits con trazabilidad.',
            procedure_text: 'Validar fuentes/listas, configuración, evidencia de ejecuciones (logs), y trazabilidad de hits (casos, resolución, escalamiento).',
            parameters_schema: {
                review_type: "technical_operational",
                coverage_metrics: true,
                checks: ["lists_sources", "execution_logs", "hit_management", "periodicity"],
                evidence_hint: ["SYSTEM_CONFIG", "SYSTEM_LOG", "CASE_FILE", "REPORT_SUBMISSION"]
            },
            owner_role: 'Compliance'
        },
        {
            code: 'CT-T10',
            title: 'Monitoreo transaccional: motor, escenarios y alertas',
            objective: 'Verificar motor de monitoreo, gestión de escenarios/reglas y generación de alertas con trazabilidad y control de cambios.',
            procedure_text: 'Revisar configuración del motor, inventario de escenarios, control de cambios, evidencia de ejecución y alertas generadas.',
            parameters_schema: {
                review_type: "technical",
                checks: ["engine_config", "scenario_inventory", "scenario_change_control", "alerts_generation"],
                evidence_hint: ["SYSTEM_CONFIG", "SYSTEM_LOG", "AUDIT_TRAIL", "TICKET"]
            },
            owner_role: 'AML Ops'
        },
        {
            code: 'CT-T11',
            title: 'Gestión de casos e investigación',
            objective: 'Verificar investigación, documentación del racional y decisión final con trazabilidad completa.',
            procedure_text: 'Muestrear casos: validar evidencia, análisis, tiempos, decisión (sospecha/no), aprobaciones si aplica, y auditabilidad del workflow.',
            parameters_schema: {
                review_type: "operational",
                sampling: true,
                default_sample_size: 30,
                checks: ["evidence_present", "rationale_documented", "decision_recorded", "workflow_traceability"],
                evidence_hint: ["CASE_FILE", "AUDIT_TRAIL", "WORKFLOW_EVENT"]
            },
            owner_role: 'AML Analyst'
        },
        {
            code: 'CT-T12',
            title: 'Reportes regulatorios, retención y disponibilidad',
            objective: 'Verificar envío regulatorio, archivo, retención y capacidad de respuesta a autoridades (retrieval).',
            procedure_text: 'Validar procedimiento, evidencia de envío/acuse, archivo, retención y prueba de recuperación (retrieval test).',
            parameters_schema: {
                review_type: "documentary_operational",
                checks: ["submission", "acknowledgement", "retention", "retrieval_test"],
                evidence_hint: ["REPORT_SUBMISSION", "AUDIT_TRAIL", "POLICY", "QUERY_RESULT"]
            },
            owner_role: 'Compliance'
        },
        {
            code: 'CT-T13',
            title: 'Seguridad de acceso: RBAC mínimo y SoD técnica',
            objective: 'Verificar mínimo privilegio y segregación técnica de funciones en sistemas AML.',
            procedure_text: 'Revisar RBAC/roles/permisos, evidencia de revisiones periódicas y validación de incompatibilidades.',
            parameters_schema: {
                review_type: "technical",
                checks: ["least_privilege", "role_review", "SoD_conflicts"],
                evidence_hint: ["SYSTEM_CONFIG", "AUDIT_TRAIL", "SYSTEM_LOG"]
            },
            owner_role: 'IT Security'
        },
        {
            code: 'CT-T14',
            title: 'Logging, monitoreo e inmutabilidad',
            objective: 'Verificar registro de eventos críticos, monitoreo efectivo y mecanismos de integridad/inmutabilidad.',
            procedure_text: 'Validar cobertura de logging, retención, integridad, monitoreo (alertas/dashboards) y evidencia de respuesta.',
            parameters_schema: {
                review_type: "technical",
                checks: ["logging_coverage", "retention", "log_monitoring", "immutability"],
                evidence_hint: ["SYSTEM_LOG", "AUDIT_TRAIL", "SYSTEM_CONFIG", "REPORT_SUBMISSION"]
            },
            owner_role: 'IT'
        },
        {
            code: 'CT-T15',
            title: 'Gobierno y validación de modelos',
            objective: 'Verificar lifecycle de modelos: versionado, validación independiente, backtesting, drift y control de cambios.',
            procedure_text: 'Revisar documentación, versionado, evidencias de validación/backtesting, monitoreo de drift y tickets/aprobaciones de cambios.',
            parameters_schema: {
                review_type: "model_risk",
                checks: ["versioning", "independent_validation", "backtesting", "drift_monitoring", "change_control"],
                evidence_hint: ["MODEL_DOC", "MODEL_VALIDATION", "TICKET", "QUERY_RESULT"]
            },
            owner_role: 'Model Risk'
        },
        {
            code: 'CT-T16',
            title: 'Capacitación y competencias',
            objective: 'Verificar capacitación periódica, cobertura, evaluación y trazabilidad de competencias AML.',
            procedure_text: 'Validar plan anual, población objetivo, asistencia, evaluaciones y control de reincidencia para personal crítico.',
            parameters_schema: {
                review_type: "documentary",
                checks: ["training_plan", "coverage", "assessment_results", "critical_roles_included"],
                evidence_hint: ["TRAINING_RECORD", "REPORT_SUBMISSION"]
            },
            owner_role: 'HR / Compliance'
        },
        {
            code: 'CT-T17',
            title: 'Gestión de hallazgos y remediación',
            objective: 'Verificar registro, priorización, asignación, seguimiento y cierre validado de hallazgos AML.',
            procedure_text: 'Revisar sistema centralizado: severidad, due dates, evidencias, validación de cierre y gobernanza del backlog.',
            parameters_schema: {
                review_type: "workflow",
                checks: ["logging", "prioritization", "ownership", "due_dates", "closure_validation"],
                evidence_hint: ["TICKET", "AUDIT_TRAIL", "REPORT_SUBMISSION"]
            },
            owner_role: 'Compliance'
        },
        {
            code: 'CT-T18',
            title: 'Calidad de datos AML',
            objective: 'Verificar controles de calidad de datos: completitud, validez, monitoreo y remediación con trazabilidad.',
            procedure_text: 'Validar reglas DQ (campos críticos), evidencia de monitoreo, alertas, tickets de remediación y verificación post-fix.',
            parameters_schema: {
                review_type: "data",
                checks: ["completeness", "validity", "monitoring", "remediation", "post_fix_verification"],
                evidence_hint: ["DATA_QUALITY", "SYSTEM_LOG", "TICKET", "REPORT_SUBMISSION"]
            },
            owner_role: 'Data Governance'
        }
    ];

    try {
        for (const test of tests) {
            const query = `
        INSERT INTO controltest_test_catalog (
          id, code, title, objective, procedure_text, parameters_schema, owner_role, status, effective_from, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) ON CONFLICT (code) DO NOTHING;
      `;
            const values = [
                test.code,
                test.title,
                test.objective,
                test.procedure_text,
                JSON.stringify(test.parameters_schema),
                test.owner_role,
                'DRAFT',
                '2026-03-05',
                '2026-03-05',
                '2026-03-05'
            ];
            await client.query(query, values);
        }
        console.log('Successfully seeded 18 tests into controltest_test_catalog!');
    } catch (err) {
        console.error('Error seeding test catalog:', err.message);
    } finally {
        await client.end();
    }
}

run();
