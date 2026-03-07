const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    const sql = `
WITH dt AS (
    SELECT
        cdt.id AS control_dimension_test_id,
        tc.code AS test_code,
        tc.title AS test_title,
        dm.dimension,
        cdt.expected_frequency,
        cdt.automation_method
    FROM corpus.controltest_dimension_test cdt
    JOIN corpus.controltest_test_catalog tc
      ON tc.id = cdt.test_id
    JOIN corpus.controltest_dimension_model dm
      ON dm.id = cdt.control_dimension_id
),
ev AS (
    SELECT
        id AS evidence_id,
        code AS evidence_code
    FROM corpus.controltest_evidence_catalog
),
req_map AS (
    SELECT *
    FROM (VALUES
        -- CT-T01 Política/Programa aprobado y vigente
        ('CT-T01','POLICY_DOCUMENT',1,'STATIC','Debe existir un documento vigente, identificable y aplicable al control evaluado.'),
        ('CT-T01','APPROVAL_RECORD',1,'STATIC','Debe existir evidencia formal de aprobación de la versión vigente por autoridad competente.'),
        ('CT-T01','CHANGE_LOG',1,'STATIC','Debe existir control de versión, fecha y trazabilidad mínima de cambios.'),

        -- CT-T02 Procedimiento documentado y mantenido
        ('CT-T02','PROCEDURE_DOCUMENT',1,'STATIC','Debe existir procedimiento o guía operativa vigente aplicable al control.'),
        ('CT-T02','CHANGE_LOG',1,'STATIC','Debe existir historial mínimo de cambios, revisión o mantenimiento documental.'),
        ('CT-T02','AUDIT_TRAIL',1,'YEAR','Debe existir evidencia verificable de que el procedimiento fue aplicado en la práctica.'),

        -- CT-T03 Designación formal de rol crítico
        ('CT-T03','ROLE_APPOINTMENT',1,'STATIC','Debe existir designación formal del rol crítico, vigente y atribuible.'),
        ('CT-T03','APPROVAL_RECORD',1,'STATIC','Debe existir aprobación o formalización válida del nombramiento.'),

        -- CT-T04 Independencia, segregación y acceso a gobierno
        ('CT-T04','ORG_CHART',1,'STATIC','Debe existir evidencia formal de estructura y línea de reporte.'),
        ('CT-T04','RACI_MATRIX',1,'STATIC','Debe existir definición explícita de responsabilidades y segregación de funciones.'),
        ('CT-T04','GOVERNANCE_MINUTES',1,'YEAR','Debe existir acceso funcional o reporte a instancias de gobierno.'),

        -- CT-T05 Gobernanza y reporte periódico
        ('CT-T05','REPORT_SAMPLE',2,'GOV','Debe existir evidencia de reportes periódicos emitidos con contenido suficiente.'),
        ('CT-T05','GOVERNANCE_MINUTES',2,'GOV','Debe existir evidencia de revisión, discusión o decisión en instancia de gobierno.'),
        ('CT-T05','ACTION_TRACKER',1,'GOV','Debe existir seguimiento verificable de acciones derivadas de los reportes.'),

        -- CT-T06 RBA: metodología y evaluación periódica
        ('CT-T06','RISK_METHODOLOGY',1,'STATIC','Debe existir metodología formal del enfoque basado en riesgo.'),
        ('CT-T06','RISK_ASSESSMENT_OUTPUT',1,'YEAR','Debe existir al menos una evaluación vigente o reciente con resultados verificables.'),
        ('CT-T06','APPROVAL_RECORD',1,'STATIC','Debe existir aprobación formal de metodología o evaluación cuando aplique.'),

        -- CT-T07 Regla obligatoria con bloqueo (hard-stop)
        ('CT-T07','CONFIG_EXPORT',1,'STATIC','Debe existir evidencia técnica de la regla de bloqueo configurada.'),
        ('CT-T07','SYSTEM_LOG',2,'FREQ_OP','Debe existir evidencia técnica de ejecuciones o bloqueos efectivos en el sistema.'),
        ('CT-T07','CONTROL_TEST_RESULT',2,'FREQ_OP','Debe existir prueba positiva y negativa que demuestre bloqueo cuando corresponde y continuidad cuando no corresponde.'),

        -- CT-T08 EDD: diligencia reforzada y aprobación
        ('CT-T08','CASE_FILE',2,'FREQ_OP','Debe existir muestra verificable de casos con EDD aplicada.'),
        ('CT-T08','WORKFLOW_EVENT',2,'FREQ_OP','Debe existir trazabilidad del workflow de aprobación o escalamiento.'),
        ('CT-T08','APPROVAL_RECORD',1,'YEAR','Debe existir aprobación obligatoria en los casos donde aplique.'),

        -- CT-T09 Screening de sanciones y manejo de coincidencias
        ('CT-T09','CONFIG_EXPORT',1,'STATIC','Debe existir configuración verificable de listas, parámetros o fuentes de screening.'),
        ('CT-T09','EXTERNAL_LIST_EVIDENCE',1,'YEAR','Debe existir evidencia de la fuente externa o lista utilizada por el proceso de screening.'),
        ('CT-T09','SYSTEM_LOG',2,'FREQ_OP','Debe existir evidencia de ejecuciones del screening en la ventana exigida.'),
        ('CT-T09','CASE_FILE',2,'FREQ_OP','Debe existir muestra de hits gestionados con resolución trazable.'),

        -- CT-T10 Monitoreo transaccional: motor, escenarios y alertas
        ('CT-T10','SCENARIO_CONFIGURATION',1,'STATIC','Debe existir inventario o configuración verificable de escenarios/reglas.'),
        ('CT-T10','CHANGE_LOG',1,'YEAR','Debe existir trazabilidad mínima de cambios a escenarios o parámetros.'),
        ('CT-T10','SYSTEM_LOG',2,'FREQ_OP','Debe existir evidencia técnica de ejecución del motor o corridas.'),
        ('CT-T10','ALERT_SAMPLE',3,'FREQ_OP','Debe existir muestra suficiente de alertas generadas en la operación.'),

        -- CT-T11 Gestión de casos e investigación
        ('CT-T11','CASE_FILE',3,'FREQ_OP','Debe existir muestra de expedientes completos con análisis y decisión.'),
        ('CT-T11','WORKFLOW_EVENT',3,'FREQ_OP','Debe existir trazabilidad de estados, asignaciones o cierre del workflow.'),
        ('CT-T11','AUDIT_TRAIL',1,'FREQ_OP','Debe existir rastro verificable de tiempos, usuarios y decisiones.'),

        -- CT-T12 Reportes regulatorios, retención y disponibilidad
        ('CT-T12','REGULATORY_SUBMISSION',1,'YEAR','Debe existir evidencia de envío regulatorio en la ventana aplicable.'),
        ('CT-T12','ACKNOWLEDGEMENT_RECORD',1,'YEAR','Debe existir acuse o confirmación de recepción.'),
        ('CT-T12','RETENTION_RECORD',1,'STATIC','Debe existir evidencia de archivo o retención conforme a política/regla.'),
        ('CT-T12','RETRIEVAL_TEST_RESULT',1,'YEAR','Debe existir al menos una prueba verificable de recuperación o disponibilidad.'),

        -- CT-T13 Seguridad de acceso: RBAC mínimo y SoD técnica
        ('CT-T13','SYSTEM_CONFIG',1,'STATIC','Debe existir configuración verificable de roles, permisos o reglas de acceso.'),
        ('CT-T13','ACCESS_LOG',2,'FREQ_OP','Debe existir evidencia reciente de uso/accesos privilegiados o revisiones.'),
        ('CT-T13','AUDIT_TRAIL',1,'FREQ_OP','Debe existir trazabilidad de cambios de privilegios, revisiones o conflictos.'),

        -- CT-T14 Logging, monitoreo e inmutabilidad
        ('CT-T14','SYSTEM_CONFIG',1,'STATIC','Debe existir configuración verificable de logging, retención o integridad.'),
        ('CT-T14','SYSTEM_LOG',2,'FREQ_OP','Debe existir evidencia de eventos críticos registrados dentro de la ventana exigida.'),
        ('CT-T14','AUDIT_TRAIL',1,'FREQ_OP','Debe existir trazabilidad o evidencia de monitoreo y respuesta sobre eventos.'),

        -- CT-T15 Gobierno y validación de modelos
        ('CT-T15','MODEL_DOCUMENT',1,'STATIC','Debe existir documentación vigente del modelo, supuestos y versión.'),
        ('CT-T15','MODEL_VALIDATION_REPORT',1,'YEAR','Debe existir validación independiente vigente o reciente.'),
        ('CT-T15','BACKTEST_RESULT',1,'YEAR','Debe existir evidencia de backtesting o prueba retrospectiva.'),
        ('CT-T15','DRIFT_MONITORING_REPORT',1,'YEAR','Debe existir evidencia de monitoreo de drift o performance.'),

        -- CT-T16 Capacitación y competencias
        ('CT-T16','TRAINING_RECORD',1,'YEAR','Debe existir evidencia del plan, ejecución y resultados de capacitación.'),
        ('CT-T16','REPORT_SAMPLE',1,'YEAR','Debe existir consolidado o reporte de cobertura suficiente.'),

        -- CT-T17 Gestión de hallazgos y remediación
        ('CT-T17','REMEDIATION_TICKET',2,'FREQ_OP','Debe existir muestra de hallazgos con responsable, severidad y fechas.'),
        ('CT-T17','ACTION_TRACKER',1,'YEAR','Debe existir seguimiento consolidado del backlog o plan de remediación.'),
        ('CT-T17','CLOSURE_VALIDATION_RECORD',1,'YEAR','Debe existir evidencia de validación de cierre efectivo.'),

        -- CT-T18 Calidad de datos AML
        ('CT-T18','DATA_QUALITY_REPORT',2,'FREQ_OP','Debe existir evidencia de monitoreo de calidad de datos en la ventana exigida.'),
        ('CT-T18','EXCEPTION_REPORT',2,'FREQ_OP','Debe existir evidencia de excepciones, brechas o alertas detectadas.'),
        ('CT-T18','REMEDIATION_TICKET',2,'FREQ_OP','Debe existir evidencia de remediación de incidencias de datos.'),
        ('CT-T18','DATA_RECONCILIATION_RESULT',1,'FREQ_OP','Debe existir evidencia de verificación o reconciliación post-fix o de integridad.')
    ) AS x(
        test_code,
        evidence_code,
        min_quantity,
        window_rule,
        acceptance_notes
    )
),
prepared AS (
    SELECT
        dt.control_dimension_test_id,
        dt.test_code,
        dt.dimension,
        dt.expected_frequency,
        rm.evidence_code,
        ev.evidence_id,
        true AS required,
        rm.min_quantity,
        CASE rm.window_rule
            WHEN 'STATIC' THEN NULL
            WHEN 'YEAR'   THEN 365
            WHEN 'GOV' THEN
                CASE dt.expected_frequency
                    WHEN 'MONTHLY'   THEN 120
                    WHEN 'QUARTERLY' THEN 365
                    WHEN 'ANNUAL'    THEN 365
                    WHEN 'WEEKLY'    THEN 90
                    WHEN 'DAILY'     THEN 30
                    WHEN 'AD_HOC'    THEN 365
                    ELSE 365
                END
            WHEN 'FREQ_OP' THEN
                CASE dt.expected_frequency
                    WHEN 'DAILY'     THEN 30
                    WHEN 'WEEKLY'    THEN 35
                    WHEN 'MONTHLY'   THEN 90
                    WHEN 'QUARTERLY' THEN 180
                    WHEN 'ANNUAL'    THEN 365
                    WHEN 'AD_HOC'    THEN 365
                    ELSE 365
                END
            ELSE NULL
        END AS window_days,
        rm.acceptance_notes
    FROM dt
    JOIN req_map rm
      ON rm.test_code = dt.test_code
    JOIN ev
      ON ev.evidence_code = rm.evidence_code
)
INSERT INTO corpus.controltest_required_evidence
(
    id,
    control_dimension_test_id,
    evidence_id,
    required,
    min_quantity,
    window_days,
    acceptance_notes,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    p.control_dimension_test_id,
    p.evidence_id,
    p.required,
    p.min_quantity,
    p.window_days,
    p.acceptance_notes,
    NOW(),
    NOW()
FROM prepared p
WHERE NOT EXISTS (
    SELECT 1
    FROM corpus.controltest_required_evidence re
    WHERE re.control_dimension_test_id = p.control_dimension_test_id
      AND re.evidence_id = p.evidence_id
)
RETURNING id;
  `;

    try {
        const res = await client.query(sql);
        console.log('Successfully mapped ' + res.rowCount + ' required evidence records into controltest_required_evidence!');
    } catch (err) {
        console.error('Error mapping required evidence:', err.message);
    } finally {
        await client.end();
    }
}

run();
