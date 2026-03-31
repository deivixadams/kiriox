begin;

drop table if exists xdata.backup_control_eval_before_cyb_insert_batch13_20260329;
create table xdata.backup_control_eval_before_cyb_insert_batch13_20260329 as
select *
from core.control_evaluation_catalog;

create temp table tmp_cyb_group_13 (
  id text,
  control_id text,
  code text,
  title text,
  evaluation_guidance text,
  pass_criteria text,
  fail_criteria text,
  evaluator_steps text,
  evidence_required text,
  evidence_min_spec text,
  sample_guidance text,
  notes text,
  status text,
  is_active text,
  framework_version_id text,
  effective_from text,
  effective_to text,
  created_at text,
  updated_at text
);

copy tmp_cyb_group_13
from stdin
with (format text, delimiter '|', null 'NULL');
b13000001-4a22-4d8f-b001-c1a100000001|ad7fb48a-3056-4a00-b8f7-25abb96399f4|TST-CYB-CTL061-01|Prueba operativa de restriccion y contencion de movimiento lateral|Verificar que la organizacion limita y contiene el desplazamiento lateral entre activos, segmentos, identidades o entornos, mediante controles efectivos de acceso, segmentacion y monitoreo.|La muestra evidencia restricciones efectivas entre nodos relevantes, caminos limitados y tratamiento de rutas de movimiento lateral identificadas.|Existen rutas amplias de propagacion, accesos transversales excesivos o ausencia de controles suficientes para contener desplazamiento lateral.|{"steps":[{"order":1,"action":"identificar activos, segmentos, credenciales y rutas criticas donde el movimiento lateral tenga alto impacto"},{"order":2,"action":"seleccionar muestra de flujos, relaciones de confianza, accesos administrativos y conectividad transversal"},{"order":3,"action":"validar restricciones efectivas de acceso, segmentacion, jump hosts, PAM o controles equivalentes"},{"order":4,"action":"revisar hallazgos, ejercicios o incidentes del periodo asociados a rutas de movimiento lateral"},{"order":5,"action":"documentar caminos no restringidos, permisos encadenables o confianza excesiva"}]}|Diagramas de red, ACL, reglas, PAM, bastiones, inventarios, hallazgos, tickets, evidencias de monitoreo.|Cada caso debe permitir demostrar que una ruta de movimiento lateral esta restringida o tratada.|Este control es estructuralmente crítico porque una sola ruta abierta puede multiplicar el daño.|Muy alineado con la capa de grafo: propagación y cascada.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000002|ad7fb48a-3056-4a00-b8f7-25abb96399f4|TST-CYB-CTL061-02|Prueba de deteccion y tratamiento de patrones de movimiento lateral|Evaluar si la organizacion detecta y trata eventos, secuencias o patrones compatibles con movimiento lateral real o potencial.|La muestra evidencia deteccion, investigacion y contencion de patrones de desplazamiento lateral o abuso de relaciones de confianza.|No existen detecciones útiles, los eventos se ignoran o no se escalan pese a señales relevantes de propagacion.|{"steps":[{"order":1,"action":"identificar eventos y fuentes relevantes para movimiento lateral como autenticaciones remotas, pivotes, uso de cuentas privilegiadas, accesos entre segmentos y herramientas administrativas"},{"order":2,"action":"solicitar alertas, casos o investigaciones del periodo"},{"order":3,"action":"seleccionar muestra por severidad, impacto o recurrencia"},{"order":4,"action":"validar triage, investigacion, contencion y cierre"},{"order":5,"action":"documentar señales no tratadas, ruido excesivo o ausencia de reglas efectivas"}]}|SIEM, UEBA, EDR, logs de autenticacion, casos de SOC, tickets, bloqueos, acciones de contencion.|Cada caso debe mostrar señal, análisis, decisión y acción aplicada.|No basta limitar rutas; hay que vigilar si alguien intenta usarlas.|Prueba operativa del plano de detección de propagación.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000003|95ad6037-f305-4af5-aaf7-0aa5d1f7cd6a|TST-CYB-CTL062-01|Prueba operativa de segmentacion efectiva entre entornos y redes|Verificar que los entornos y redes se encuentran segmentados de forma efectiva segun criticidad, funcion y riesgo, con flujos limitados y justificados.|La muestra evidencia separacion efectiva, flujos minimos necesarios y ausencia de conectividad transversal injustificada entre segmentos criticos.|Existen entornos mezclados, reglas excesivamente abiertas o conectividad no justificada que anula la segmentacion declarada.|{"steps":[{"order":1,"action":"identificar entornos y segmentos relevantes como produccion, desarrollo, pruebas, usuarios, administracion y terceros"},{"order":2,"action":"seleccionar muestra de flujos entre segmentos por criticidad"},{"order":3,"action":"validar reglas efectivas, justificacion de negocio y owner del flujo"},{"order":4,"action":"confirmar que no existan aperturas amplias o permanentes sin necesidad real"},{"order":5,"action":"documentar mezclas de entorno, accesos cruzados o segmentacion solo nominal"}]}|Diagramas, reglas de firewall, ACL, inventarios, tickets de cambio, ownership de flujos, hallazgos.|Cada flujo muestreado debe mostrar origen, destino, justificación y configuración efectiva.|Segmentación declarada sin enforcement es una ilusión de aislamiento.|Prueba base del aislamiento real entre dominios técnicos.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000004|95ad6037-f305-4af5-aaf7-0aa5d1f7cd6a|TST-CYB-CTL062-02|Prueba de control de cambios y excepciones en segmentacion|Evaluar si las aperturas, cambios o excepciones en segmentacion se aprueban, limitan y revierten de forma controlada.|La muestra evidencia cambios trazables, aprobacion valida, vigencia definida y cierre o revision posterior de excepciones.|Las excepciones se vuelven permanentes, las aperturas carecen de aprobación o no se revisan después de habilitarse.|{"steps":[{"order":1,"action":"solicitar cambios y excepciones del periodo relacionados con flujos de red y segmentacion"},{"order":2,"action":"seleccionar muestra por criticidad y antiguedad"},{"order":3,"action":"validar aprobacion, justificacion, fecha de inicio, vencimiento y compensacion si aplica"},{"order":4,"action":"confirmar si la apertura sigue siendo necesaria o fue cerrada"},{"order":5,"action":"documentar aperturas envejecidas, no justificadas o sin gobierno"}]}|Tickets de cambio, aprobaciones, excepciones, revisiones periódicas, evidencias de cierre, reglas vigentes.|Cada caso debe ser trazable desde la solicitud hasta el estado final de la apertura.|La excepción en red suele convertirse en bypass institucionalizado si no se gobierna.|Conecta segmentación con disciplina de cambio real.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000005|a46a6f25-3bb9-4953-ae07-d267035b4bd5|TST-CYB-CTL063-01|Prueba operativa de restriccion y trazabilidad de acceso a codigo fuente|Verificar que el codigo fuente se encuentra bajo control de acceso efectivo, con trazabilidad de acciones relevantes y sin exposicion innecesaria.|La muestra evidencia repositorios restringidos, permisos acordes al rol y trazabilidad de accesos y acciones criticas.|Existen repositorios expuestos, accesos excesivos o falta de trazabilidad suficiente sobre acciones relevantes.|{"steps":[{"order":1,"action":"identificar repositorios y organizaciones de codigo fuente criticos"},{"order":2,"action":"seleccionar muestra por criticidad del proyecto, sensibilidad y tipo de acceso"},{"order":3,"action":"validar permisos efectivos, owners, ramas protegidas y registros de actividad relevante"},{"order":4,"action":"comparar acceso real contra necesidad de negocio y rol del usuario"},{"order":5,"action":"documentar accesos excesivos, repositorios abiertos o falta de rastro de acciones"}]}|Permisos de repositorio, logs de auditoria, ownership, configuracion de ramas, listas de miembros, tickets o aprobaciones.|Cada caso debe mostrar repositorio, permisos efectivos, rol y trazabilidad de acciones críticas.|El código fuente es un activo estructural; su exposición cambia todo el perfil de riesgo.|Prueba base del control real sobre repositorios.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000006|a46a6f25-3bb9-4953-ae07-d267035b4bd5|TST-CYB-CTL063-02|Prueba de proteccion operativa contra exposicion o extraccion de codigo fuente|Evaluar si la organizacion detecta y trata eventos de comparticion, descarga masiva, copia o exposicion no autorizada de codigo fuente.|La muestra evidencia alertas, investigaciones o restricciones efectivas frente a exposicion no autorizada del codigo.|No existe monitoreo suficiente, las exposiciones no se detectan o se toleran sin tratamiento verificable.|{"steps":[{"order":1,"action":"identificar controles aplicables a exportacion, clonacion, comparticion externa o exfiltracion de codigo fuente"},{"order":2,"action":"solicitar alertas, eventos o hallazgos del periodo"},{"order":3,"action":"seleccionar muestra por severidad o criticidad del repositorio"},{"order":4,"action":"validar analisis, contencion, escalamiento y cierre"},{"order":5,"action":"documentar canales de exposicion no cubiertos o eventos no tratados"}]}|Alertas de repositorio, DLP, logs de descarga o comparticion, tickets, investigaciones, acciones correctivas.|Cada caso debe mostrar evento, análisis y acción ejecutada.|No basta proteger el acceso; importa detectar la salida o exposición del código.|Complementa acceso con capacidad real de contención.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000007|0bea2597-c6a4-4820-b153-7c938a92eafc|TST-CYB-CTL064-01|Prueba operativa de integracion de practicas de desarrollo seguro en el ciclo de entrega|Verificar que el desarrollo seguro se aplica en la operacion real del ciclo de entrega y no solo como requisito documental.|La muestra evidencia controles de seguridad integrados en diseño, codificacion, revision, build o despliegue con tratamiento de hallazgos.|Las practicas de desarrollo seguro no se aplican de forma consistente o quedan fuera del flujo real de entrega.|{"steps":[{"order":1,"action":"seleccionar muestra de proyectos, aplicaciones o cambios recientes"},{"order":2,"action":"revisar artefactos y flujos del SDLC o pipeline asociados"},{"order":3,"action":"validar presencia de controles de seguridad como revisiones, escaneos, gates o aprobaciones"},{"order":4,"action":"confirmar tratamiento de hallazgos antes del despliegue o decisión formal si hubo excepción"},{"order":5,"action":"documentar proyectos donde el control de seguridad no participó o fue bypassado"}]}|Pipelines, evidencias de escaneo, revisiones de código, approvals, tickets, hallazgos, cierres o excepciones.|Cada caso debe mostrar que la seguridad pasó por el flujo real y produjo efecto verificable.|Desarrollo seguro sin inserción en el delivery es ceremonial, no operativo.|Prueba operativa principal del SSDLC.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000008|0bea2597-c6a4-4820-b153-7c938a92eafc|TST-CYB-CTL064-02|Prueba de cierre efectivo de hallazgos de desarrollo seguro|Evaluar si los hallazgos de seguridad detectados durante el desarrollo se corrigen o se aceptan formalmente bajo control.|Los hallazgos muestreados muestran cierre técnico verificable o excepción formal con vigencia y compensación.|Los hallazgos quedan abiertos, se cierran sin prueba o los despliegues ocurren con brechas no tratadas informalmente.|{"steps":[{"order":1,"action":"solicitar hallazgos de seguridad generados en desarrollo del periodo"},{"order":2,"action":"seleccionar muestra por criticidad y cercania al despliegue"},{"order":3,"action":"validar evidencia de correccion o aceptacion formal del riesgo"},{"order":4,"action":"confirmar si el artefacto fue desplegado bajo la condicion registrada"},{"order":5,"action":"documentar cierres débiles, hallazgos envejecidos o despliegues con riesgo sin gobierno"}]}|Hallazgos de SAST, DAST, SCA, revisiones manuales, tickets, evidencias de corrección, excepciones aprobadas.|Cada hallazgo debe tener severidad, decisión, evidencia y estado final consistente con el despliegue.|Aquí se prueba si el desarrollo seguro corrige o solo observa.|Complementa el control de integración con efectividad real sobre hallazgos.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000009|2e01b072-5dce-411d-b0d0-a150a3c6240f|TST-CYB-CTL065-01|Prueba operativa de definicion y trazabilidad de requisitos de seguridad|Verificar que los requisitos de seguridad se definen desde etapas tempranas y quedan trazados hasta diseño, implementación y validación.|La muestra evidencia requisitos claros, trazables y vinculados a artefactos del ciclo de entrega.|Los requisitos son vagos, tardíos, no trazables o no afectan realmente el diseño o la implementación.|{"steps":[{"order":1,"action":"seleccionar proyectos, cambios o iniciativas recientes con impacto tecnologico"},{"order":2,"action":"identificar requisitos de seguridad definidos para cada caso"},{"order":3,"action":"validar su trazabilidad hacia historias, diseños, tareas, criterios de aceptación o pruebas"},{"order":4,"action":"confirmar que los requisitos influyeron en decisiones o controles concretos"},{"order":5,"action":"documentar requisitos ausentes, ambiguos o sin efecto operativo"}]}|Backlogs, historias, ADRs, especificaciones, criterios de aceptación, tickets, matrices de trazabilidad.|Cada caso debe permitir seguir el requisito desde definición hasta implementación o prueba.|Requisito sin trazabilidad es intención, no control.|Prueba base para que el desarrollo seguro tenga fundamento real.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b13000001-4a22-4d8f-b001-c1a100000010|2e01b072-5dce-411d-b0d0-a150a3c6240f|TST-CYB-CTL065-02|Prueba de validacion operativa del cumplimiento de requisitos de seguridad|Evaluar si los requisitos de seguridad definidos son realmente verificados antes de liberar o aceptar cambios relevantes.|La muestra evidencia pruebas, revisiones o validaciones que confirman el cumplimiento de requisitos de seguridad antes de liberar.|Los requisitos se definen pero no se validan o se liberan cambios sin comprobar su cumplimiento.|{"steps":[{"order":1,"action":"seleccionar muestra de requisitos de seguridad definidos en proyectos o cambios recientes"},{"order":2,"action":"identificar la evidencia de validacion asociada a cada requisito"},{"order":3,"action":"validar si la prueba o verificacion fue suficiente, trazable y previa a la liberacion"},{"order":4,"action":"confirmar si hubo desviaciones, excepciones o liberaciones condicionadas"},{"order":5,"action":"documentar requisitos no verificados o validados solo de forma declarativa"}]}|Casos de prueba, revisiones, checklists, hallazgos, gates, aprobaciones, evidencias previas a despliegue.|Cada requisito muestreado debe tener evidencia concreta de validación o excepción formal.|Aquí se cierra la brecha entre requisito escrito y control realmente probado.|Muy útil para Kiriox Audit y Audit Continua.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
\.

with normalized as (
  select
    (
      case
        when length(split_part(id, '-', 1)) > 8 then
          left(split_part(id, '-', 1), 8) || '-' || split_part(id, '-', 2) || '-' || split_part(id, '-', 3) || '-' || split_part(id, '-', 4) || '-' || split_part(id, '-', 5)
        else id
      end
    ) as id_norm,
    control_id,
    code,
    title,
    evaluation_guidance,
    pass_criteria,
    fail_criteria,
    evaluator_steps,
    evidence_required,
    evidence_min_spec,
    sample_guidance,
    notes,
    status,
    is_active,
    framework_version_id,
    effective_from,
    effective_to,
    created_at,
    updated_at
  from tmp_cyb_group_13
),
ins as (
  insert into core.control_evaluation_catalog (
    id,
    control_id,
    dimension_id,
    code,
    title,
    evaluation_guidance,
    pass_criteria,
    fail_criteria,
    evaluator_steps,
    evidence_required,
    evidence_min_spec,
    sample_guidance,
    notes,
    status,
    is_active,
    framework_version_id,
    effective_from,
    effective_to,
    created_at,
    updated_at
  )
  select
    n.id_norm::uuid,
    n.control_id::uuid,
    'c288a358-ef38-4c64-960b-43fffb9a3412'::uuid,
    n.code,
    n.title,
    n.evaluation_guidance,
    n.pass_criteria,
    n.fail_criteria,
    n.evaluator_steps::jsonb,
    n.evidence_required,
    n.evidence_min_spec,
    n.sample_guidance,
    n.notes,
    n.status,
    n.is_active::boolean,
    n.framework_version_id::uuid,
    n.effective_from::timestamptz,
    n.effective_to::timestamptz,
    n.created_at::timestamptz,
    n.updated_at::timestamptz
  from normalized n
  where not exists (
    select 1
    from core.control_evaluation_catalog c
    where c.id = n.id_norm::uuid
       or c.code = n.code
  )
  returning 1
)
select count(*) as inserted_rows
from ins;

commit;
