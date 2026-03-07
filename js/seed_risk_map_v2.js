const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus' });

// FW_AML_V1 = 768b8105-935b-42e3-af21-dc63e5ff8292
const FW = '768b8105-935b-42e3-af21-dc63e5ff8292';

// [control_id, risk_id, mitigation_strength, effect_type, rationale, coverage_notes]
const rows = [
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0001', 'cfa1ccb7-cf8f-4753-bb63-d175467d4f4f', 5, 'preventive', 'El programa formal aprobado es la existencia del marco AML.', 'Evidencia: acta/aprobación/versión vigente'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0002', 'cfa1ccb7-cf8f-4753-bb63-d175467d4f4f', 4, 'preventive', 'Políticas/procedimientos operacionalizan el programa y lo hacen ejecutable.', 'Cobertura: onboarding/MT/ROS/sanciones'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2001', 'cd65a681-428e-4b60-8a50-c7f0056af2b3', 5, 'governance', 'Gobernanza del directorio define supervisión y accountability.', 'Minutas, comités, decisiones'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2002', 'cd65a681-428e-4b60-8a50-c7f0056af2b3', 4, 'governance', 'Reporte periódico fuerza control gerencial y visibilidad de brechas.', 'Cadencia, métricas, hallazgos'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2003', 'cd65a681-428e-4b60-8a50-c7f0056af2b3', 4, 'governance', 'Sin recursos suficientes el gobierno es nominal.', 'Headcount, presupuesto, tooling'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2008', 'edd2056a-47cd-4588-83a8-5a13b9e36b33', 5, 'corrective', 'Gestión de cambios evita obsolescencia por regulación/negocio/modelos.', 'Registro cambios + aprobaciones'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0002', 'edd2056a-47cd-4588-83a8-5a13b9e36b33', 3, 'preventive', 'Políticas versionadas y actualizadas reflejan el programa vivo.', 'Control de versiones'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0006', 'd63febe6-5064-450b-a518-15497f5dcb5b', 4, 'preventive', 'Metodología RBA traduce apetito a parámetros y umbrales.', 'Riesgo→segmentos→controles'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0007', 'd63febe6-5064-450b-a518-15497f5dcb5b', 4, 'governance', 'Evaluación institucional valida consistencia entre apetito y realidad.', 'Actas/aprobación RBA'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000009', 'd63febe6-5064-450b-a518-15497f5dcb5b', 3, 'preventive', 'Segmentación operacionaliza apetito en tratamiento diferenciado.', 'Reglas + excepciones'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0004', '20e6da15-2cee-4816-8d50-2d282f8a9263', 5, 'governance', 'Independencia funcional reduce captura y conflicto de interés.', 'Estructura organizacional'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0005', '20e6da15-2cee-4816-8d50-2d282f8a9263', 4, 'governance', 'Acceso directo al board evita bloqueo gerencial.', 'Escalamiento y reporting'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0003', '20e6da15-2cee-4816-8d50-2d282f8a9263', 3, 'governance', 'Designación formal fija mandato y autoridad.', 'Carta de nombramiento'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0016', 'b8797dec-8783-4d53-9b49-50ad6fe04fa6', 4, 'resilience', 'Disponibilidad inmediata evita no puedo responder al regulador.', 'SLA, consultas, repositorio'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000006', 'b8797dec-8783-4d53-9b49-50ad6fe04fa6', 4, 'resilience', 'Calidad de datos condiciona monitoreo y decisiones.', 'DQ rules, reconciliación'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000007', 'b8797dec-8783-4d53-9b49-50ad6fe04fa6', 3, 'detective', 'Completitud detecta gaps de ingesta/cobertura.', 'Coverage por fuente/atributo'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0006', '6cb65512-d8df-4854-a343-28ece721420a', 5, 'preventive', 'Metodología RBA define variables, ponderaciones y trazabilidad.', 'Modelo documentado'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2010', '6cb65512-d8df-4854-a343-28ece721420a', 3, 'detective', 'Auditoría basada en riesgo verifica que el RBA no sea nominal.', 'Pruebas/validaciones'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0007', 'c610daea-8c5e-46f2-b9d4-43644098050e', 4, 'governance', 'Evaluación institucional obliga a confrontar realidad vs supuestos.', 'Evidencias + recalibración'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2009', 'c610daea-8c5e-46f2-b9d4-43644098050e', 3, 'detective', 'Auditoría independiente detecta subestimación por sesgo interno.', 'Informes + hallazgos'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000012', 'c610daea-8c5e-46f2-b9d4-43644098050e', 3, 'model_risk', 'Drift puede mover el riesgo real sin que lo vean.', 'Monitoreo + alertas'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000009', '26187359-7ceb-40c9-93f9-afacbeacae57', 5, 'preventive', 'Segmentación es el control directo del riesgo.', 'Reglas, umbrales, overrides'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000006', '26187359-7ceb-40c9-93f9-afacbeacae57', 3, 'resilience', 'Datos malos producen segmentación mala.', 'Data lineage/quality'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2015', '0b89039e-02bd-4d86-90ff-941e4ce3936e', 5, 'preventive', 'Riesgo de nuevos productos evita introducir canales sin controles.', 'Go/no-go + mitigaciones'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2008', '0b89039e-02bd-4d86-90ff-941e4ce3936e', 3, 'corrective', 'Gestión de cambios captura evoluciones del producto.', 'Registro de cambios'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000018', '5ac47a97-251b-49a3-bf12-6508b0d5a6fb', 4, 'corrective', 'Workflow de casos operacionaliza respuesta cuando hay señal.', 'SLA, colas, escalamiento'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000014', '5ac47a97-251b-49a3-bf12-6508b0d5a6fb', 4, 'detective', 'Alertas transforman triggers en objetos accionables.', 'Umbrales + trazabilidad'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000012', 'a993feb1-e815-4cde-9875-9d4d945389f2', 5, 'model_risk', 'Monitoreo de drift es el control directo.', 'Métricas + umbrales'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000013', 'a993feb1-e815-4cde-9875-9d4d945389f2', 4, 'model_risk', 'Gestión de cambios evita drift silencioso por releases.', 'Change approvals'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000010', 'a993feb1-e815-4cde-9875-9d4d945389f2', 4, 'model_risk', 'Validación independiente detecta degradación no vista por dueño.', 'Independiente'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2013', '2e6223a2-184d-4543-b319-34568e6f6371', 5, 'preventive', 'Gestión de terceros controla outsourcing/partners.', 'Due diligence, SLA, monitoreo'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2014', '2e6223a2-184d-4543-b319-34568e6f6371', 3, 'corrective', 'Excepciones formalizan desvíos y reducen arbitrariedad.', 'Aprobación + caducidad'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2009', '581acad2-047c-4b79-af60-ec867cff5be4', 5, 'detective', 'Auditoría independiente es el control directo del testing.', 'Independencia real'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2010', '581acad2-047c-4b79-af60-ec867cff5be4', 3, 'detective', 'Plan basado en riesgo evita pruebas cosméticas.', 'Cobertura priorizada'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2012', '717d0d62-e901-4ef2-913f-2f1629e6c024', 5, 'corrective', 'Seguimiento de remediación es el control directo.', 'Fechas, owners, evidence'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2011', '717d0d62-e901-4ef2-913f-2f1629e6c024', 4, 'corrective', 'Gestión de hallazgos convierte finding en plan ejecutable.', 'Ciclo completo'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000006', 'f106bbeb-0229-4549-af8e-caf7debb665e', 5, 'resilience', 'Control directo de DQ (exactitud/consistencia).', 'Reglas + reconcil.'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000007', 'f106bbeb-0229-4549-af8e-caf7debb665e', 4, 'detective', 'Completitud detecta integraciones rotas.', 'Cobertura por feed'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000008', 'f106bbeb-0229-4549-af8e-caf7debb665e', 4, 'corrective', 'Remediación corrige backlog de data issues.', 'Tickets + reprocess'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0008', 'b2ea4573-1f18-4574-adca-98795e2f9743', 5, 'preventive', 'Identificación obligatoria es el control directo.', 'KYC mínimo'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000001', 'b2ea4573-1f18-4574-adca-98795e2f9743', 4, 'preventive', 'Verificación documental reduce identidades falsas.', 'Doc checks'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000003', 'b2ea4573-1f18-4574-adca-98795e2f9743', 4, 'preventive', 'Bloqueo por expediente incompleto evita aperturas inválidas.', 'Hard-stop'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000002', 'd9862f44-5f9e-48f7-a18c-e33c32cc1248', 5, 'preventive', 'Captura completa del expediente es control directo.', 'Campos obligatorios'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000004', 'd9862f44-5f9e-48f7-a18c-e33c32cc1248', 3, 'preventive', 'Propósito relación comercial completa KYC contextual.', 'SoW/SoF'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000006', 'd9862f44-5f9e-48f7-a18c-e33c32cc1248', 4, 'corrective', 'Actualización periódica reduce degradación del KYC.', 'Frecuencia por riesgo'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0009', 'ae32bce6-c4ec-4321-8013-9f9ba01d5123', 5, 'preventive', 'Identificación de UBO es control directo.', 'Estructuras complejas'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000007', 'ae32bce6-c4ec-4321-8013-9f9ba01d5123', 3, 'preventive', 'EDD refuerza UBO cuando hay opacidad.', 'Clientes alto riesgo'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000007', 'a313b97a-d4db-49d5-9596-2537dbed37ab', 4, 'preventive', 'EDD existe como mecanismo reforzado.', 'Criterios'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000008', 'a313b97a-d4db-49d5-9596-2537dbed37ab', 5, 'preventive', 'Workflow obligatorio EDD fuerza ejecución, no intención.', 'Hard enforcement'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000010', '0cd5b2fa-8f09-412b-a5eb-122c390b41c3', 4, 'detective', 'Screening onboarding detecta PEP al inicio.', 'Listas/umbral'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000011', '0cd5b2fa-8f09-412b-a5eb-122c390b41c3', 4, 'detective', 'Screening periódico detecta cambios posteriores.', 'Re-screen'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000007', '0cd5b2fa-8f09-412b-a5eb-122c390b41c3', 3, 'preventive', 'EDD aplica tratamiento reforzado a PEP.', 'Aprobación senior'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0014', '0b972768-3990-4699-b681-98a5609e2e55', 5, 'detective', 'Screening sanciones es control directo.', 'Listas + matching'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000010', '0b972768-3990-4699-b681-98a5609e2e55', 4, 'detective', 'Onboarding screening reduce exposición temprana.', 'Entrada'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000011', '0b972768-3990-4699-b681-98a5609e2e55', 4, 'detective', 'Screening periódico reduce gap temporal.', 'Continuo'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000018', '82412509-6e8b-4be0-8431-383d97d595e9', 3, 'corrective', 'Workflow de casos debe disparar acciones (incl. congelamiento).', 'Acciones por tipo de match'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0014', '82412509-6e8b-4be0-8431-383d97d595e9', 3, 'detective', 'Sin detección de sanciones no hay ejecución de congelamiento.', 'Detección upstream'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0012', '5eb4a754-6cfb-42b7-9d71-c4f89f2ce475', 4, 'detective', 'Monitoreo transaccional AML es control directo.', 'Cobertura + tuning'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000012', '5eb4a754-6cfb-42b7-9d71-c4f89f2ce475', 4, 'detective', 'Motor MT ejecuta escenarios y alertas.', 'Escenarios'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '5eb4a754-6cfb-42b7-9d71-c4f89f2ce475', 4, 'detective', 'Gestión de escenarios evita ceguera y obsolescencia.', 'Versionado'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000007', '1069cb76-bcc9-4fc5-8e59-8b2c445d7955', 4, 'detective', 'Completitud de datos detecta feeds faltantes.', 'Coverage'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000014', '1069cb76-bcc9-4fc5-8e59-8b2c445d7955', 3, 'detective', 'Integridad del sistema detecta fallas técnicas del pipeline.', 'Uptime + checks'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '1069cb76-bcc9-4fc5-8e59-8b2c445d7955', 3, 'detective', 'Escenarios versionados obligan a definir cobertura esperada.', 'Matriz cobertura'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000016', 'c9af81bd-2602-4f56-aaf9-9f2211bc5761', 4, 'resilience', 'Documentación de análisis permite auditoría y repetición.', 'Plantillas + evidencia'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000015', 'c9af81bd-2602-4f56-aaf9-9f2211bc5761', 4, 'corrective', 'Investigación formal reduce decisiones arbitrarias.', 'Triage + steps'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000005', 'c9af81bd-2602-4f56-aaf9-9f2211bc5761', 4, 'resilience', 'Audit trail inmutable protege reproducibilidad ex post.', 'No repudio'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000017', '89c5c6c7-b040-421a-8960-56d9cd7de9e9', 5, 'corrective', 'Decisión formal con resultado trazable es el control directo.', 'Criterios + QA'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000016', '89c5c6c7-b040-421a-8960-56d9cd7de9e9', 3, 'resilience', 'Documentación soporta revisión y segunda línea.', 'Soporte'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0013', '0fbccfc1-475e-4166-a4cd-929d19ddb22f', 4, 'corrective', 'Reporte ROS como obligación ejecutable.', 'Tiempos/formatos'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000019', '0fbccfc1-475e-4166-a4cd-929d19ddb22f', 5, 'corrective', 'Reporte ROS a autoridad es el control directo del evento.', 'SLA + envío'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000020', '0fbccfc1-475e-4166-a4cd-929d19ddb22f', 3, 'resilience', 'Archivo ROS permite completitud y evidencia.', 'Repositorio'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2006', 'cbb0fd91-7e0a-4242-8413-51ce452f74a7', 3, 'preventive', 'Código de ética define prohibiciones y conducta.', 'Políticas + sanciones'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2007', 'cbb0fd91-7e0a-4242-8413-51ce452f74a7', 3, 'corrective', 'Proceso disciplinario reduce reincidencia y eleva disuasión.', 'Casos disciplinarios'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000001', 'cbb0fd91-7e0a-4242-8413-51ce452f74a7', 4, 'preventive', 'Acceso mínimo reduce filtraciones operativas.', 'RBAC'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000005', 'cbb0fd91-7e0a-4242-8413-51ce452f74a7', 3, 'resilience', 'Audit trail inmutable inhibe manipulación y fugas.', 'No repudio'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0015', '360ba540-f0e7-461f-9fb3-b540c8d48e38', 4, 'resilience', 'Conservación de registros asegura retención.', 'Política + evidencia'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000005', '360ba540-f0e7-461f-9fb3-b540c8d48e38', 5, 'resilience', 'Audit trail inmutable garantiza integridad.', 'WORM/immutability'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000003', '360ba540-f0e7-461f-9fb3-b540c8d48e38', 3, 'detective', 'Logs permiten detectar borrados/manipulación.', 'Log retention'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0016', '3d1f9081-44a0-4412-9cc5-f35d11b209bf', 5, 'resilience', 'Disponibilidad inmediata es el control directo.', 'SLA + repositorio'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000014', '3d1f9081-44a0-4412-9cc5-f35d11b209bf', 3, 'resilience', 'Integridad del sistema evita caídas y pérdida de acceso.', 'Continuidad'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0017', '90a07f0e-f403-49f6-a112-45afd23f3705', 4, 'detective', 'Reporte de efectivo cubre colocación por cash.', 'Umbrales + agregación'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '90a07f0e-f403-49f6-a112-45afd23f3705', 3, 'detective', 'Escenarios específicos detectan patrones cash.', 'Escenarios cash'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '9a77d6fc-beed-46e9-96f1-cffe4af8f9bb', 4, 'detective', 'Escenarios detectan fragmentación y agregación temporal.', 'Rolling windows'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000012', '9a77d6fc-beed-46e9-96f1-cffe4af8f9bb', 3, 'detective', 'Motor MT ejecuta escenarios.', 'Cobertura'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '6a16587d-414c-46d9-be80-981be0a9495d', 4, 'detective', 'Escenarios capturan circularidad/capas (layering).', 'Graph-like patterns'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '5373e1e8-b44d-4b24-9528-f400cb31e065', 3, 'detective', 'Escenarios detectan mixing por anomalías vs perfil.', 'Perfilamiento + desvíos'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000005', '5373e1e8-b44d-4b24-9528-f400cb31e065', 3, 'preventive', 'Perfil económico mejora detección de incongruencias.', 'Baselines'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '0756c6b9-0060-4c07-8c22-dc24e3a879f3', 3, 'detective', 'Escenarios de velocidad/turnover.', 'Velocity rules'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '8feeeb14-3e3c-4cfe-a282-b53b08669fe4', 3, 'detective', 'Escenarios de integración tras layering (patrones largo plazo).', 'Series temporales'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '2b18e495-784a-4633-a11c-e3e911a76a84', 3, 'detective', 'Escenarios TBML (trade patterns).', 'Requiere data trade'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0018', '1f9ddae7-c8bd-42d3-bf1e-5677c9709f3e', 5, 'preventive', 'DD de corresponsal controla canal de mayor riesgo.', 'Due diligence + límites'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '1f9ddae7-c8bd-42d3-bf1e-5677c9709f3e', 3, 'detective', 'Escenarios corresponsalía (nested/passthrough).', 'Cobertura rutas/hubs'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', '7e86d48b-33c8-46f0-8bc3-27f78fc8a758', 4, 'detective', 'Escenarios cross-border por jurisdicción/corredor.', 'Country risk'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0006', '7e86d48b-33c8-46f0-8bc3-27f78fc8a758', 3, 'preventive', 'RBA define tratamiento por país/canal.', 'Segmentos'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2013', '1c737ab8-07e3-43e3-82fa-cde9e5e7bfb0', 3, 'governance', 'Terceros/canales permiten arbitraje; gobernanza de terceros lo reduce.', 'Outsourcing/channel control'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2015', '1c737ab8-07e3-43e3-82fa-cde9e5e7bfb0', 3, 'preventive', 'Nuevos productos sin evaluación abren arbitraje.', 'Go/no-go'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000013', 'c29fd43b-f6da-4ea1-924e-139748b63329', 4, 'detective', 'Escenarios velocity/funnels/passthrough.', 'High-frequency patterns'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000014', 'c29fd43b-f6da-4ea1-924e-139748b63329', 3, 'resilience', 'Integridad del sistema evita huecos en tiempo real.', 'Uptime/latency'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0009', 'ba330329-5d7c-416b-bde7-b859f76a108a', 4, 'preventive', 'UBO reduce opacidad fiduciaria.', 'Look-through'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000007', 'ba330329-5d7c-416b-bde7-b859f76a108a', 3, 'preventive', 'EDD para estructuras complejas.', 'SoF/SoW'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0009', '80c64e72-8661-4ace-af96-022c9d74802b', 4, 'preventive', 'UBO reduce opacidad de sociedades.', 'Ownership chain'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000007', '80c64e72-8661-4ace-af96-022c9d74802b', 3, 'preventive', 'EDD para corporativos complejos.', 'Control persons'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0009', '18e1c43e-0b55-4606-843f-48795841968c', 4, 'preventive', 'UBO combate nominees/terceros.', 'Look-through'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000007', '18e1c43e-0b55-4606-843f-48795841968c', 3, 'preventive', 'EDD aumenta escrutinio.', 'SoF/SoW'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0009', '65e48960-8a09-469b-b267-86a99d922b03', 5, 'preventive', 'UBO es control directo de opacidad.', 'Ownership depth'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000007', '65e48960-8a09-469b-b267-86a99d922b03', 3, 'preventive', 'EDD para opacidad persistente.', 'Enhanced review'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2004', '3acfc1f6-cade-45b6-923d-320692e9a654', 3, 'preventive', 'Segregación de funciones reduce colusión simple.', 'SoD'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000002', '3acfc1f6-cade-45b6-923d-320692e9a654', 3, 'preventive', 'Segregación técnica reduce abuso por privilegios.', 'RBAC + SoD'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000005', '3acfc1f6-cade-45b6-923d-320692e9a654', 4, 'resilience', 'Audit trail inmutable eleva detección y disuasión.', 'No repudio'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2009', '3acfc1f6-cade-45b6-923d-320692e9a654', 3, 'detective', 'Auditoría independiente detecta colusión organizada.', 'Forensic'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2001', 'c316f838-b08e-490c-a9a9-191f3ca2c57a', 3, 'governance', 'Gobierno fuerte reduce incumplimientos que disparan sanciones.', 'Supervisión'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000019', 'c316f838-b08e-490c-a9a9-191f3ca2c57a', 3, 'corrective', 'ROS oportuno evita agravantes por omisión.', 'Cumplimiento reportes'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2009', '64c655e5-0261-463c-9862-6a1d4919be9d', 3, 'detective', 'Auditoría independiente reduce fallas sistémicas.', 'Detección temprana'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0015', '64c655e5-0261-463c-9862-6a1d4919be9d', 3, 'resilience', 'Registros completos facilitan defensa regulatoria.', 'Evidencia'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0001', '76b13dcb-f775-443f-9213-ace662bfc301', 3, 'preventive', 'Programa formal reduce incumplimiento estructural.', 'Base AML'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0012', '76b13dcb-f775-443f-9213-ace662bfc301', 3, 'detective', 'Monitoreo transaccional reduce exposición no detectada.', 'Detección'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2002', 'c52ccea1-ff6b-4dab-ab48-2507e4e0d518', 3, 'governance', 'Reporting al board reduce negligencia y omisión de deberes.', 'Trazabilidad'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2006', 'c52ccea1-ff6b-4dab-ab48-2507e4e0d518', 2, 'preventive', 'Código ética fija estándares y responsabilidades.', 'Conducta'],
    ['c7f3c1b4-2d1f-4a1e-9c01-101000000017', 'ef750fe6-2660-4f10-b5e8-1a2de0b42d52', 3, 'corrective', 'Decisiones trazables reducen dolo/ceguera deliberada.', 'Razonamiento documentado'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000005', 'ef750fe6-2660-4f10-b5e8-1a2de0b42d52', 3, 'resilience', 'Evidencia íntegra permite defensa/cooperación.', 'No repudio'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2005', 'eb2155b2-f233-46ed-be97-43828a1de115', 2, 'preventive', 'Capacitación reduce negligencia individual.', 'Training logs'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000003', 'eb2155b2-f233-46ed-be97-43828a1de115', 2, 'detective', 'Logs soportan accountability.', 'Auditability'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0013', '7e246a79-48c5-46b7-a4a9-1032bcf9b264', 2, 'corrective', 'ROS oportuno reduce exposición acumulada.', 'Acción temprana'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0012', '7e246a79-48c5-46b7-a4a9-1032bcf9b264', 2, 'detective', 'MT detecta antes de que se consoliden activos.', 'Detección'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0018', 'b4124a27-b18f-4899-9566-a744cf00286a', 4, 'preventive', 'DD corresponsal protege relación por estándares internacionales.', 'CDD/EDD'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2002', 'b4124a27-b18f-4899-9566-a744cf00286a', 2, 'governance', 'Transparencia al board mejora postura frente a corresponsales.', 'Governance'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2012', '4ee7179f-d185-441e-8918-1d6fc7826cc6', 3, 'corrective', 'Remediación efectiva reduce escalamiento regulatorio.', 'Closing rate'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2009', '4ee7179f-d185-441e-8918-1d6fc7826cc6', 2, 'detective', 'Auditoría aumenta credibilidad frente al regulador.', 'Independencia'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0012', 'a2aa9082-2e1f-473f-871a-37d34df1ee19', 2, 'detective', 'MT reduce exposición mediática por fallas graves.', 'Prevención por detección'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2001', 'a2aa9082-2e1f-473f-871a-37d34df1ee19', 2, 'governance', 'Gobernanza reduce escándalos por negligencia.', 'Tone at top'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2003', '1bb63f47-5e47-426a-839c-0e60c3b44025', 3, 'governance', 'Recursos insuficientes vuelven sistémica la falla.', 'Capacidad'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000014', '1bb63f47-5e47-426a-839c-0e60c3b44025', 2, 'resilience', 'Integridad sistémica evita colapso por fallas técnicas.', 'Continuidad'],
    ['c1a8a5d2-1c24-4b68-b5a1-9c8aef9e0001', 'dff54c52-57fd-4817-a8b4-a03d78e636bd', 3, 'preventive', 'Programa AML es el armazón: sin él, colapsa.', 'Marco base'],
    ['9e1c2c4a-8d7b-4c1a-a1f1-401000000014', 'dff54c52-57fd-4817-a8b4-a03d78e636bd', 3, 'resilience', 'Integridad del sistema evita fallas catastróficas operativas.', 'Health checks'],
    ['5b02c9a1-ff7c-4d5b-a7a1-2e8e9d5e2012', 'dff54c52-57fd-4817-a8b4-a03d78e636bd', 2, 'corrective', 'Remediación evita degradación continua hasta colapso.', 'Backlog control'],
];

async function run() {
    await client.connect();
    let count = 0;

    try {
        // Truncate first
        console.log('Truncating map_risk_control...');
        await client.query('TRUNCATE TABLE corpus.map_risk_control;');
        console.log('Truncated.');

        for (const r of rows) {
            await client.query(`
        INSERT INTO corpus.map_risk_control (control_id, risk_id, mitigation_strength, framework_version_id, effect_type, rationale, coverage_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [r[0], r[1], r[2], FW, r[3], r[4], r[5]]);
            count++;
        }

        console.log(`\nInserted: ${count} rows.`);
        const total = await client.query('SELECT COUNT(*) FROM corpus.map_risk_control;');
        console.log(`Total in map_risk_control: ${total.rows[0].count}`);
    } catch (err) {
        console.error(`Error at row ${count + 1}:`, err.message);
    } finally {
        await client.end();
    }
}

run();
