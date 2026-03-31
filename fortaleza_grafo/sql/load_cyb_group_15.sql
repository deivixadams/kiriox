begin;

drop table if exists xdata.backup_control_eval_before_cyb_insert_batch15_20260329;
create table xdata.backup_control_eval_before_cyb_insert_batch15_20260329 as
select *
from core.control_evaluation_catalog;

create temp table tmp_cyb_group_15 (
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

copy tmp_cyb_group_15
from stdin
with (format text, delimiter '|', null 'NULL');
b15000001-4a22-4d8f-b001-c1a100000001|5e2f50a3-f3e9-43c9-a466-d7014858e8e2|TST-CYB-CTL071-01|Prueba operativa de aprobacion y ejecucion controlada de cambios|Verificar que los cambios relevantes en sistemas, infraestructura, seguridad o configuracion se aprueban, ejecutan y cierran bajo control trazable y coherente con el riesgo.|La muestra evidencia solicitud, aprobacion valida, evaluacion de impacto, ejecucion controlada y cierre verificable del cambio.|Existen cambios ejecutados sin aprobacion, con aprobador inadecuado, sin evaluacion de impacto o sin cierre sustentado.|{"steps":[{"order":1,"action":"solicitar cambios ejecutados en el periodo sobre sistemas, configuraciones, infraestructura o seguridad"},{"order":2,"action":"seleccionar muestra por criticidad, urgencia, impacto y tipo de activo"},{"order":3,"action":"validar solicitud, aprobacion, evaluacion de impacto, plan de implementacion y evidencia de ejecucion"},{"order":4,"action":"confirmar si el cambio quedo reflejado en el estado real del activo o servicio"},{"order":5,"action":"documentar cambios fuera de proceso, aprobaciones debiles o cierres solo administrativos"}]}|Tickets de cambio, aprobaciones, analisis de impacto, evidencias de implementacion, registros de despliegue o configuracion, cierres.|Cada caso debe mostrar trazabilidad completa desde solicitud hasta estado final real.|No evaluar solo CAB o workflow; bajar al cambio material en el sistema.|Prueba operativa central del control de cambios.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000002|5e2f50a3-f3e9-43c9-a466-d7014858e8e2|TST-CYB-CTL071-02|Prueba de gestion de cambios urgentes y reversibilidad|Evaluar si los cambios urgentes o de emergencia se ejecutan bajo control suficiente y con capacidad real de reversa o estabilizacion posterior.|Los cambios urgentes revisados muestran autorizacion excepcional valida, justificacion, trazabilidad y verificacion posterior o rollback cuando aplico.|Los cambios urgentes se vuelven bypass del proceso, sin autorizacion suficiente, sin reversa o sin revision posterior.|{"steps":[{"order":1,"action":"solicitar cambios urgentes o de emergencia del periodo"},{"order":2,"action":"seleccionar muestra por impacto y criticidad"},{"order":3,"action":"validar justificacion, aprobacion excepcional, plan de reversa o mitigacion y evidencia de ejecucion"},{"order":4,"action":"confirmar revision posterior al cambio y decision de estabilizacion final"},{"order":5,"action":"documentar emergencias recurrentes, falta de reversa o uso abusivo del canal urgente"}]}|Registros de emergencia, aprobaciones excepcionales, cronologias, rollback, revisiones post cambio, incidentes asociados.|Cada caso debe mostrar por qué fue urgente y cómo se controló su ejecución y cierre.|El cambio urgente mal gobernado es bypass operativo con alto potencial de cascada.|Muy alineado con Kiriox: gatillos, bypass y ruptura por urgencia mal controlada.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000003|9ce13a7f-3213-4550-adc9-8b3043a6d977|TST-CYB-CTL072-01|Prueba operativa de proteccion de datos de prueba en entornos no productivos|Verificar que los datos usados en pruebas, QA o desarrollo se encuentran protegidos y no exponen informacion real sensible sin control adecuado.|La muestra evidencia uso de datos enmascarados, sinteticos o protegidos, con acceso restringido y justificacion cuando existen excepciones.|Se usan datos reales sensibles sin proteccion suficiente, sin necesidad justificada o con acceso amplio en entornos no productivos.|{"steps":[{"order":1,"action":"identificar entornos y procesos donde se usan datos de prueba o copias de producción"},{"order":2,"action":"seleccionar muestra por criticidad de la aplicación y sensibilidad del dato"},{"order":3,"action":"validar origen del dato, técnica de protección aplicada, restricciones de acceso y propósito del uso"},{"order":4,"action":"revisar si existen excepciones para uso de datos reales y su gobierno formal"},{"order":5,"action":"documentar uso indebido de datos reales o protección insuficiente"}]}|Inventarios de datasets, evidencias de masking o síntesis, ACL, tickets, aprobaciones, excepciones, configuraciones.|Cada caso debe demostrar qué dato se usó, cómo se protegió y quién pudo acceder.|Datos de prueba son un vector clásico de exposición invisible.|Prueba operativa principal del control sobre data no productiva.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000004|9ce13a7f-3213-4550-adc9-8b3043a6d977|TST-CYB-CTL072-02|Prueba de control de acceso y ciclo de vida de datos de prueba|Evaluar si los datos de prueba se crean, usan, almacenan y eliminan bajo control, evitando persistencia innecesaria o exposicion residual.|La muestra evidencia acceso restringido, uso temporal o controlado y disposicion o limpieza verificable del dato de prueba.|Los datos de prueba quedan persistentes, accesibles en exceso o sin disposicion final controlada.|{"steps":[{"order":1,"action":"seleccionar conjuntos de datos de prueba o copias usadas recientemente"},{"order":2,"action":"validar quién tuvo acceso, durante cuánto tiempo y en qué entorno"},{"order":3,"action":"revisar si existió eliminación, expiración o limpieza posterior al uso"},{"order":4,"action":"confirmar si el dataset quedó replicado, exportado o almacenado fuera del control esperado"},{"order":5,"action":"documentar persistencias indebidas, accesos excesivos o falta de limpieza"}]}|ACL, bitácoras de acceso, tickets de provisión y baja, evidencias de limpieza o expiración, inventarios temporales.|Cada caso debe mostrar acceso, permanencia y cierre del ciclo de vida del dataset.|No basta enmascarar; importa también limitar permanencia y propagación del dato.|Complementa protección del dato con gobierno operativo del ciclo de vida.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000005|304e8eec-eb22-4e8c-ba05-bcf086ecbd85|TST-CYB-CTL073-01|Prueba operativa de identificacion y actualizacion de riesgos ciberneticos relevantes|Verificar que la organizacion identifica riesgos ciberneticos relevantes de forma viva, con actualizacion frente a cambios de negocio, tecnologia, amenazas o incidentes.|La muestra evidencia riesgos identificados, responsables asignados y actualizaciones ligadas a cambios o eventos relevantes.|Los riesgos estan desactualizados, no reflejan el entorno real o no tienen dueño ni revisiones trazables.|{"steps":[{"order":1,"action":"solicitar el registro o universo de riesgos ciberneticos del periodo"},{"order":2,"action":"seleccionar muestra por criticidad, dominio o cambios recientes del entorno"},{"order":3,"action":"validar responsable, fecha de actualizacion, detonante de revision y consistencia con el contexto tecnico u operativo"},{"order":4,"action":"revisar si incidentes, cambios o nuevas exposiciones provocaron actualizacion del riesgo"},{"order":5,"action":"documentar riesgos obsoletos, incompletos o desconectados del entorno real"}]}|Registros de riesgos, revisiones, actas, ownership, cambios relevantes, incidentes, evidencias de actualización.|Cada riesgo muestreado debe mostrar vigencia, owner y razón de revisión o permanencia.|Riesgo no actualizado es mapa viejo sobre terreno cambiante.|Prueba operativa del proceso de identificación viva del riesgo.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000006|304e8eec-eb22-4e8c-ba05-bcf086ecbd85|TST-CYB-CTL073-02|Prueba de priorizacion efectiva del riesgo cibernetico|Evaluar si la priorizacion del riesgo refleja exposición real, criticidad de activos, amenazas observadas y dependencias relevantes, y si se traduce en acción operativa.|La muestra evidencia criterios de priorizacion coherentes con exposición real y acciones o decisiones alineadas al nivel de riesgo.|La priorizacion es arbitraria, no refleja criticidad real o no influye decisiones, remediaciones o seguimiento.|{"steps":[{"order":1,"action":"seleccionar muestra de riesgos priorizados altos, medios y bajos"},{"order":2,"action":"revisar criterios utilizados para su priorizacion y la evidencia subyacente"},{"order":3,"action":"comparar la prioridad declarada con activos afectados, amenazas, incidentes, dependencias y controles asociados"},{"order":4,"action":"validar si la priorizacion produjo seguimiento, tratamiento o decisiones proporcionales"},{"order":5,"action":"documentar riesgos subestimados, sobreestimados o sin consecuencia operativa"}]}|Matrices de priorización, criterios, evidencias de soporte, planes de tratamiento, incidentes, dependencias, activos críticos.|Cada caso debe permitir explicar por qué el riesgo quedó donde quedó y qué efecto tuvo esa clasificación.|Aquí conviene distinguir lo lineal de lo estructural: prioridad aparente versus criticidad sistémica real.|Prueba clave para Kiriox Risk y Kiriox Audit.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000007|64b9b560-1a78-407d-af9b-d466512d90a7|TST-CYB-CTL074-01|Prueba operativa de visibilidad del universo de activos y superficie de ataque|Verificar que la organizacion mantiene visibilidad operativa suficiente de activos, servicios expuestos, tecnologías y superficies de exposición internas y externas.|La muestra evidencia inventario vivo, reconciliación con fuentes técnicas y conocimiento suficiente de activos o servicios expuestos.|Existen activos, servicios o exposiciones desconocidas, no reconciliadas o fuera del radar operacional.|{"steps":[{"order":1,"action":"obtener universo de activos y servicios desde inventarios y fuentes técnicas de descubrimiento"},{"order":2,"action":"seleccionar muestra de activos internos, externos y servicios expuestos por criticidad"},{"order":3,"action":"validar presencia en inventario, ownership, criticidad y visibilidad operativa real"},{"order":4,"action":"realizar prueba inversa desde la fuente técnica o exposición observada hacia el inventario"},{"order":5,"action":"documentar activos desconocidos, huerfanos o exposiciones no gobernadas"}]}|Inventarios, ASM o escaneo externo, CMDB, EDR, descubrimiento de red, DNS, cloud inventories, ownership.|Debe existir muestra bidireccional: del inventario a la realidad y de la realidad al inventario.|Este control es nuclear porque determina qué parte del sistema realmente existe para el modelo.|Muy alineado con Kiriox: visibilidad del grafo real versus grafo asumido.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000008|64b9b560-1a78-407d-af9b-d466512d90a7|TST-CYB-CTL074-02|Prueba de tratamiento de activos expuestos o no gobernados|Evaluar si la organizacion detecta y trata oportunamente activos expuestos, desconocidos, obsoletos o sin owner claro dentro de la superficie de ataque.|La muestra evidencia identificación, análisis y cierre o regularización de exposiciones no gobernadas.|Los activos expuestos permanecen sin tratamiento, sin owner o sin decisión formal de riesgo.|{"steps":[{"order":1,"action":"solicitar hallazgos del periodo asociados a activos expuestos, desconocidos o fuera de gobierno"},{"order":2,"action":"seleccionar muestra por criticidad, exposición y antigüedad"},{"order":3,"action":"validar análisis, owner asignado, acción correctiva y fecha de cierre"},{"order":4,"action":"confirmar si el activo fue retirado, regularizado, ocultado o asumido formalmente"},{"order":5,"action":"documentar exposiciones persistentes o sin tratamiento suficiente"}]}|Hallazgos ASM, tickets, ownership, acciones correctivas, evidencias de retiro o regularización, excepciones formales.|Cada caso debe mostrar exposición detectada, decisión y estado final verificable.|Lo peligroso no es solo ver mal, sino ver y no cerrar.|Complementa visibilidad con capacidad real de saneamiento de superficie.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000009|5084dfa0-c9cf-4c54-bdcd-dd7f20c59173|TST-CYB-CTL075-01|Prueba operativa de gestion segura de secretos e identidades no humanas|Verificar que los secretos, llaves, tokens, cuentas de servicio e identidades no humanas se encuentran inventariados, restringidos y gobernados en operación real.|La muestra evidencia inventario, ownership, almacenamiento seguro, acceso restringido y uso controlado de secretos e identidades no humanas.|Existen secretos dispersos, identidades sin owner, almacenamiento inseguro o uso no gobernado de credenciales no humanas.|{"steps":[{"order":1,"action":"identificar repositorios de secretos, vaults, pipelines, cuentas de servicio, claves API, certificados y otras identidades no humanas"},{"order":2,"action":"seleccionar muestra por criticidad, privilegio y exposición"},{"order":3,"action":"validar owner, mecanismo de almacenamiento, acceso efectivo, uso esperado y ámbito del secreto o identidad"},{"order":4,"action":"revisar si existen secretos en código, variables no seguras o cuentas no humanas sin gobierno claro"},{"order":5,"action":"documentar secretos expuestos, cuentas huérfanas o mecanismos de custodia débiles"}]}|Inventarios, vaults, IAM, pipelines, repositorios, ownership, políticas, hallazgos, escaneos de secretos.|Cada caso debe mostrar secreto o identidad, owner, ubicación, restricción de acceso y uso esperado.|Este control es altamente crítico porque aquí confluyen privilegio, automatización y acceso transversal.|Muy alineado con Kiriox: nodo crítico de propagación silenciosa.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b15000001-4a22-4d8f-b001-c1a100000010|5084dfa0-c9cf-4c54-bdcd-dd7f20c59173|TST-CYB-CTL075-02|Prueba de rotacion, revocacion y trazabilidad de secretos e identidades no humanas|Evaluar si la organizacion rota, revoca y monitorea adecuadamente secretos e identidades no humanas cuando cambia el riesgo, el uso o el contexto operativo.|La muestra evidencia rotacion o revocacion oportuna, trazabilidad de uso y tratamiento de excepciones o credenciales envejecidas.|Los secretos o cuentas permanecen vigentes más allá de lo razonable, sin rotación, sin trazabilidad o sin cierre pese a cambios relevantes.|{"steps":[{"order":1,"action":"seleccionar muestra de secretos e identidades no humanas por antigüedad, privilegio y criticidad"},{"order":2,"action":"validar fecha de creación, última rotación, owner, uso efectivo y contexto actual"},{"order":3,"action":"revisar eventos de revocación, rotación o reemplazo del periodo"},{"order":4,"action":"confirmar si cambios de arquitectura, incidentes o salidas de sistemas detonaron actualización o baja"},{"order":5,"action":"documentar credenciales envejecidas, sin uso claro o sin trazabilidad suficiente"}]}|Vault logs, IAM, reportes de rotación, tickets, ownership, evidencias de revocación, hallazgos, excepciones.|Cada caso debe mostrar edad, uso, owner y decisión de mantener, rotar o revocar.|Un secreto viejo y privilegiado es una deuda latente con alto potencial de cascada.|Complementa el inventario con disciplina operativa de vida y muerte de credenciales no humanas.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
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
  from tmp_cyb_group_15
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
