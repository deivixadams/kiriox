const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

async function run() {
    await client.connect();
    await client.query('SET search_path TO corpus');

    try {
        console.log('Dropping restrictive evidence_type constraint...');
        await client.query('ALTER TABLE controltest_evidence_catalog DROP CONSTRAINT IF EXISTS evidence_catalog_evidence_type_check');

        console.log('Adding expanded evidence_type constraint...');
        const newConstraint = `
      ALTER TABLE controltest_evidence_catalog 
      ADD CONSTRAINT evidence_catalog_evidence_type_check 
      CHECK (evidence_type IN (
        'DOCUMENTARY', 'GOVERNANCE', 'RISK', 'TECHNICAL', 'OPERATIONAL', 
        'REGULATORY', 'HR', 'MODEL', 'DATA', 'WORKFLOW', 'EXTERNAL'
      ))
    `;
        await client.query(newConstraint);

        console.log('Seeding evidence catalog...');
        const seedQuery = `
      INSERT INTO controltest_evidence_catalog
      (id, evidence_type, name, spec_schema, created_at, updated_at, code, description, validation_method, is_automatable)
      VALUES
      (gen_random_uuid(),'DOCUMENTARY','Documento de política/programa','{}'::jsonb,NOW(),NOW(),'POLICY_DOCUMENT','Documento formal aprobado que establece lineamientos, alcance, responsables, versión y vigencia.','DOCUMENT_REVIEW',false),
      (gen_random_uuid(),'DOCUMENTARY','Procedimiento documentado','{}'::jsonb,NOW(),NOW(),'PROCEDURE_DOCUMENT','Procedimiento, instructivo o guía operativa con pasos, responsables, control de cambios y vigencia.','DOCUMENT_REVIEW',false),
      (gen_random_uuid(),'DOCUMENTARY','Estándar o lineamiento técnico','{}'::jsonb,NOW(),NOW(),'STANDARD_DOCUMENT','Estándar técnico o lineamiento obligatorio que define criterios mínimos de implementación o operación.','DOCUMENT_REVIEW',false),
      (gen_random_uuid(),'DOCUMENTARY','Metodología formal','{}'::jsonb,NOW(),NOW(),'METHODOLOGY_DOCUMENT','Documento metodológico con variables, supuestos, criterios, scoring o enfoque de evaluación.','METHODOLOGY_REVIEW',false),
      (gen_random_uuid(),'DOCUMENTARY','Nombramiento formal de rol','{}'::jsonb,NOW(),NOW(),'ROLE_APPOINTMENT','Carta, acta o resolución de designación formal de un rol crítico, con autoridad, alcance y vigencia.','DOCUMENT_REVIEW',false),
      (gen_random_uuid(),'GOVERNANCE','Organigrama y línea de reporte','{}'::jsonb,NOW(),NOW(),'ORG_CHART','Organigrama oficial o documento equivalente que demuestra estructura, independencia y líneas de reporte.','DOCUMENT_REVIEW',false),
      (gen_random_uuid(),'GOVERNANCE','Matriz RACI o responsabilidades','{}'::jsonb,NOW(),NOW(),'RACI_MATRIX','Matriz que define responsabilidades, segregación de funciones y dueños de procesos o controles.','DOCUMENT_REVIEW',false),
      (gen_random_uuid(),'DOCUMENTARY','Bitácora de cambios/versionado','{}'::jsonb,NOW(),NOW(),'CHANGE_LOG','Histórico de revisiones, versiones, fechas, autores y motivo de cambio.','VERSION_TRACE',false),
      (gen_random_uuid(),'GOVERNANCE','Evidencia de aprobación','{}'::jsonb,NOW(),NOW(),'APPROVAL_RECORD','Registro formal de aprobación, firma, autorización o visto bueno de autoridad competente.','APPROVAL_TRACE',false),
      (gen_random_uuid(),'GOVERNANCE','Actas o minutas de gobierno','{}'::jsonb,NOW(),NOW(),'GOVERNANCE_MINUTES','Minutas de comité, consejo o instancia de gobierno con decisiones, seguimiento, escalamiento y responsables.','MINUTES_REVIEW',false),
      (gen_random_uuid(),'GOVERNANCE','Reporte periódico o de gestión','{}'::jsonb,NOW(),NOW(),'REPORT_SAMPLE','Reporte recurrente emitido a gerencia, comité, regulador o área de control con contenido verificable.','REPORT_REVIEW',false),
      (gen_random_uuid(),'GOVERNANCE','Seguimiento de acciones','{}'::jsonb,NOW(),NOW(),'ACTION_TRACKER','Registro de acciones, compromisos, responsables, fechas objetivo y estado.','WORKFLOW_REVIEW',false),
      (gen_random_uuid(),'RISK','Metodología de riesgo','{}'::jsonb,NOW(),NOW(),'RISK_METHODOLOGY','Metodología formal del enfoque basado en riesgo con variables, scoring, segmentación y periodicidad.','METHODOLOGY_REVIEW',false),
      (gen_random_uuid(),'RISK','Resultado de evaluación de riesgo','{}'::jsonb,NOW(),NOW(),'RISK_ASSESSMENT_OUTPUT','Resultado de evaluación institucional o segmentación con hallazgos, conclusiones y plan de acción.','RESULT_REVIEW',false),
      (gen_random_uuid(),'TECHNICAL','Configuración de sistema/regla','{}'::jsonb,NOW(),NOW(),'SYSTEM_CONFIG','Configuración técnica de reglas, parámetros, roles, listas, motores o controles.','CONFIG_REVIEW',true),
      (gen_random_uuid(),'TECHNICAL','Export de configuración','{}'::jsonb,NOW(),NOW(),'CONFIG_EXPORT','Export estructurado de configuración o parámetros desde la fuente técnica.','CONFIG_REVIEW',true),
      (gen_random_uuid(),'TECHNICAL','Configuración de escenarios','{}'::jsonb,NOW(),NOW(),'SCENARIO_CONFIGURATION','Definición de escenarios, umbrales, supuestos y lógica de generación de alertas.','CONFIG_REVIEW',true),
      (gen_random_uuid(),'TECHNICAL','Log de sistema o ejecución','{}'::jsonb,NOW(),NOW(),'SYSTEM_LOG','Registro técnico de ejecución del sistema, jobs, bloqueos, decisiones o eventos relevantes.','LOG_ANALYSIS',true),
      (gen_random_uuid(),'TECHNICAL','Log de acceso','{}'::jsonb,NOW(),NOW(),'ACCESS_LOG','Registro técnico de accesos, autenticación, cambios de privilegio y uso administrativo.','LOG_ANALYSIS',true),
      (gen_random_uuid(),'TECHNICAL','Audit trail / trazabilidad','{}'::jsonb,NOW(),NOW(),'AUDIT_TRAIL','Bitácora estructurada de eventos, cambios, estados y usuario ejecutor sobre un proceso o expediente.','TRACE_RECONCILIATION',true),
      (gen_random_uuid(),'TECHNICAL','Resultado de consulta','{}'::jsonb,NOW(),NOW(),'QUERY_RESULT','Resultado trazable de query o extracción controlada sobre datos operativos, regulatorios o de control.','DATA_RECONCILIATION',true),
      (gen_random_uuid(),'TECHNICAL','Respuesta de API','{}'::jsonb,NOW(),NOW(),'API_RESPONSE','Respuesta estructurada de API que evidencia comportamiento, decisión o ejecución del sistema.','API_RECONCILIATION',true),
      (gen_random_uuid(),'TECHNICAL','Captura de pantalla','{}'::jsonb,NOW(),NOW(),'SCREENSHOT','Captura visual del estado del sistema o configuración. Evidencia complementaria, no principal.','VISUAL_INSPECTION',false),
      (gen_random_uuid(),'OPERATIONAL','Expediente o caso','{}'::jsonb,NOW(),NOW(),'CASE_FILE','Caso investigado con antecedentes, evidencia, análisis, decisión, timestamps y responsable.','CASE_INSPECTION',false),
      (gen_random_uuid(),'OPERATIONAL','Evento de workflow','{}'::jsonb,NOW(),NOW(),'WORKFLOW_EVENT','Evento del workflow que demuestra enrutamiento, aprobación, rechazo, cambio de estado o cierre.','WORKFLOW_REVIEW',true),
      (gen_random_uuid(),'OPERATIONAL','Muestra de alertas','{}'::jsonb,NOW(),NOW(),'ALERT_SAMPLE','Muestra verificable de alertas generadas por reglas, escenarios o monitoreo.','SAMPLE_INSPECTION',false),
      (gen_random_uuid(),'OPERATIONAL','Muestra de transacciones','{}'::jsonb,NOW(),NOW(),'TRANSACTION_SAMPLE','Muestra de transacciones usada para validar monitoreo, screening, cobertura o comportamiento de reglas.','SAMPLE_INSPECTION',false),
      (gen_random_uuid(),'TECHNICAL','Resultado de prueba de control','{}'::jsonb,NOW(),NOW(),'CONTROL_TEST_RESULT','Resultado de prueba positiva, negativa, walkthrough o validación controlada del control.','TEST_EXECUTION',true),
      (gen_random_uuid(),'REGULATORY','Envío regulatorio','{}'::jsonb,NOW(),NOW(),'REGULATORY_SUBMISSION','Archivo o evidencia de remisión a autoridad competente.','SUBMISSION_VERIFY',false),
      (gen_random_uuid(),'REGULATORY','Acuse de recepción','{}'::jsonb,NOW(),NOW(),'ACKNOWLEDGEMENT_RECORD','Acuse, sello, respuesta electrónica o confirmación de recepción por parte del regulador o sistema receptor.','SUBMISSION_VERIFY',false),
      (gen_random_uuid(),'REGULATORY','Registro de retención/archivo','{}'::jsonb,NOW(),NOW(),'RETENTION_RECORD','Evidencia de conservación, archivo, custodia y disponibilidad dentro del plazo exigido.','RETENTION_VERIFY',false),
      (gen_random_uuid(),'REGULATORY','Resultado de prueba de recuperación','{}'::jsonb,NOW(),NOW(),'RETRIEVAL_TEST_RESULT','Evidencia de prueba de recuperación o retrieval de información ante requerimiento.','RETRIEVAL_VERIFY',true),
      (gen_random_uuid(),'HR','Registro de capacitación','{}'::jsonb,NOW(),NOW(),'TRAINING_RECORD','Plan, asistencia, evaluación, cobertura y resultados de capacitación AML/CFT.','TRAINING_VERIFY',false),
      (gen_random_uuid(),'MODEL','Documentación del modelo','{}'::jsonb,NOW(),NOW(),'MODEL_DOCUMENT','Documento del modelo con objetivo, variables, supuestos, versión, límites y owner.','DOCUMENT_REVIEW',false),
      (gen_random_uuid(),'MODEL','Reporte de validación del modelo','{}'::jsonb,NOW(),NOW(),'MODEL_VALIDATION_REPORT','Resultado de validación independiente, desempeño, limitaciones y recomendaciones.','MODEL_REVIEW',false),
      (gen_random_uuid(),'MODEL','Resultado de backtesting','{}'::jsonb,NOW(),NOW(),'BACKTEST_RESULT','Resultado de pruebas retrospectivas del modelo o escenario.','MODEL_REVIEW',true),
      (gen_random_uuid(),'MODEL','Monitoreo de drift/performance','{}'::jsonb,NOW(),NOW(),'DRIFT_MONITORING_REPORT','Reporte de drift, estabilidad, performance y alertas del comportamiento del modelo.','MODEL_REVIEW',true),
      (gen_random_uuid(),'DATA','Reporte de calidad de datos','{}'::jsonb,NOW(),NOW(),'DATA_QUALITY_REPORT','Evidencia de completitud, validez, consistencia, monitoreo y métricas de calidad de datos AML.','DATA_RECONCILIATION',true),
      (gen_random_uuid(),'DATA','Resultado de reconciliación de datos','{}'::jsonb,NOW(),NOW(),'DATA_RECONCILIATION_RESULT','Comparación estructurada entre fuentes, totales, campos críticos o poblaciones para validar integridad.','DATA_RECONCILIATION',true),
      (gen_random_uuid(),'DATA','Reporte de excepciones','{}'::jsonb,NOW(),NOW(),'EXCEPTION_REPORT','Reporte de excepciones, faltantes, inconsistencias o brechas detectadas en operación o datos.','EXCEPTION_ANALYSIS',true),
      (gen_random_uuid(),'WORKFLOW','Ticket de remediación','{}'::jsonb,NOW(),NOW(),'REMEDIATION_TICKET','Ticket o issue con severidad, responsable, fechas, evidencias de corrección y cierre.','WORKFLOW_REVIEW',false),
      (gen_random_uuid(),'WORKFLOW','Validación de cierre','{}'::jsonb,NOW(),NOW(),'CLOSURE_VALIDATION_RECORD','Evidencia de validación independiente o de segunda línea del cierre efectivo de un hallazgo o incidente.','CLOSURE_VERIFY',false),
      (gen_random_uuid(),'EXTERNAL','Evidencia de fuente externa','{}'::jsonb,NOW(),NOW(),'EXTERNAL_LIST_EVIDENCE','Evidencia de fuente/lista externa utilizada por screening, validación o contraste.','SOURCE_VERIFY',false),
      (gen_random_uuid(),'EXTERNAL','Atestación de tercero','{}'::jsonb,NOW(),NOW(),'THIRD_PARTY_ATTESTATION','Certificación, atestación o evidencia emitida por tercero relevante para el control.','THIRD_PARTY_VERIFY',false)
    `;
        await client.query(seedQuery);

        console.log('Successfully updated constraint and seeded 44 evidence types!');
    } catch (err) {
        console.error('Error fixing/seeding evidence catalog:', err.message);
    } finally {
        await client.end();
    }
}

run();
