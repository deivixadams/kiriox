begin;

drop table if exists xdata.backup_control_eval_before_cyb_insert_batch16_20260329;
create table xdata.backup_control_eval_before_cyb_insert_batch16_20260329 as
select *
from core.control_evaluation_catalog;

create temp table tmp_cyb_group_16 (
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

copy tmp_cyb_group_16
from stdin
with (format text, delimiter '|', null 'NULL');
b16000001-4a22-4d8f-b001-c1a100000001|b6a3ab7b-25c0-46ad-b36f-fa5750c6191d|TST-CYB-CTL076-01|Prueba operativa de vigilancia y analisis de amenazas emergentes relevantes|Verificar que la organizacion mantiene vigilancia activa sobre amenazas emergentes y que esa vigilancia se traduce en analisis aplicable al entorno propio.|La muestra evidencia identificacion de amenazas emergentes relevantes, analisis de aplicabilidad y decisiones o acciones derivadas sobre el entorno.|La vigilancia existe solo como consumo pasivo de informacion, sin analisis de aplicabilidad ni efecto operativo verificable.|{"steps":[{"order":1,"action":"solicitar insumos, boletines, reportes o casos del periodo asociados a amenazas emergentes"},{"order":2,"action":"seleccionar muestra por relevancia, novedad y posible impacto sobre el entorno de la organizacion"},{"order":3,"action":"validar si cada amenaza fue analizada respecto de activos, tecnologias, procesos o proveedores propios"},{"order":4,"action":"revisar decisiones, alertas, endurecimientos, monitoreos o cambios derivados del analisis"},{"order":5,"action":"documentar vigilancia pasiva, sin priorizacion ni efecto operativo"}]}|Boletines, reportes de threat intel, tickets, matrices de aplicabilidad, cambios, alertas, actas o comunicaciones técnicas.|Cada caso debe mostrar amenaza observada, análisis de aplicabilidad y acción o decisión derivada.|No vale leer feeds; vale traducir amenaza en defensa concreta sobre el contexto propio.|Prueba operativa de threat intel útil y accionable.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000002|b6a3ab7b-25c0-46ad-b36f-fa5750c6191d|TST-CYB-CTL076-02|Prueba de integracion de amenazas emergentes en monitoreo y priorizacion|Evaluar si las amenazas emergentes relevantes se incorporan al monitoreo, a la priorizacion de riesgos o a las decisiones de endurecimiento y remediacion.|La muestra evidencia actualizacion de reglas, casos de uso, prioridades o controles a partir de amenazas emergentes aplicables.|Las amenazas se conocen pero no cambian el monitoreo, la priorizacion o la respuesta operativa.|{"steps":[{"order":1,"action":"seleccionar amenazas emergentes evaluadas como aplicables en el periodo"},{"order":2,"action":"validar si se crearon o ajustaron reglas de deteccion, monitoreo, hardening, bloqueos o prioridades"},{"order":3,"action":"confirmar fecha de implementacion y alcance de los cambios realizados"},{"order":4,"action":"revisar si esos cambios produjeron alertas, mejor cobertura o tratamiento preventivo"},{"order":5,"action":"documentar amenazas conocidas que no modificaron ningun control o prioridad"}]}|Cambios de reglas SIEM o EDR, hardening, comunicados, ajustes de prioridad, tickets, evidencias de implementación.|Cada caso debe mostrar la conexión entre amenaza emergente y cambio real en el sistema de defensa.|Muy alineado con Kiriox: pasar de señal externa a ajuste estructural interno.|Conecta inteligencia con operación, no con observación pasiva.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000003|360aa25c-cb99-4510-bc79-8e540c60c93d|TST-CYB-CTL077-01|Prueba operativa de erradicacion efectiva posterior a incidentes|Verificar que, tras un incidente de seguridad, la organizacion erradica efectivamente la causa tecnica presente y no deja persistencia residual.|La muestra evidencia erradicacion verificable, limpieza de persistencia, validacion posterior y cierre sustentado del incidente.|Se cierran incidentes sin erradicacion real, persisten artefactos o reaparece la misma intrusión por tratamiento incompleto.|{"steps":[{"order":1,"action":"solicitar incidentes del periodo donde la erradicacion tecnica fuera necesaria"},{"order":2,"action":"seleccionar muestra por severidad, tipo de compromiso y alcance"},{"order":3,"action":"validar acciones de limpieza, revocacion, remediacion tecnica y eliminación de persistencia"},{"order":4,"action":"confirmar evidencia posterior de estado limpio o estable del activo o entorno"},{"order":5,"action":"documentar cierres sin validacion o recurrencias asociadas al mismo vector"}]}|Cronologias, tickets, IOCs, evidencias de limpieza, revocaciones, reescaneos, monitoreo posterior, reportes de cierre.|Cada caso debe mostrar qué se erradicó, cómo se validó y cuál fue el estado posterior real.|Contener no es erradicar; la erradicación exige prueba de eliminación del rastro y la persistencia.|Prueba operativa principal del control de erradicación.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000004|360aa25c-cb99-4510-bc79-8e540c60c93d|TST-CYB-CTL077-02|Prueba de capacidad forense e investigacion tecnica de incidentes|Evaluar si la organizacion puede reconstruir hechos, alcance y vector de compromiso con evidencia técnica suficiente para concluir y actuar.|La muestra evidencia investigacion tecnica estructurada, artefactos suficientes y conclusiones soportadas por evidencia verificable.|Las investigaciones son superficiales, no reconstruyen el hecho o concluyen sin evidencia tecnica suficiente.|{"steps":[{"order":1,"action":"seleccionar incidentes o investigaciones del periodo con componente forense relevante"},{"order":2,"action":"revisar artefactos preservados, hipotesis evaluadas y cronologia técnica construida"},{"order":3,"action":"validar si la investigación determinó origen, alcance, artefactos, identidades o vector de ataque"},{"order":4,"action":"confirmar que las conclusiones finales se apoyan en evidencia técnica disponible"},{"order":5,"action":"documentar vacios probatorios, inferencias débiles o conclusiones no sostenibles"}]}|Evidencias preservadas, informes forenses, cronologías, hashes, logs, análisis de alcance, conclusiones técnicas.|Cada caso debe permitir seguir la cadena lógica desde artefacto observado hasta conclusión final.|Sin capacidad forense, la organización corrige síntomas y no entiende el daño real.|Conecta evidencia, análisis y defensa posterior del caso.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000005|4d93e1d3-2b2e-4ab3-a03a-70d81401a791|TST-CYB-CTL078-01|Prueba operativa de seguridad en aplicaciones y APIs en produccion|Verificar que las aplicaciones y APIs en operacion mantienen controles efectivos de autenticacion, autorizacion, exposicion y monitoreo sobre trafico real.|La muestra evidencia controles activos, configuracion segura y tratamiento operativo de hallazgos o eventos sobre aplicaciones y APIs en produccion.|Existen aplicaciones o APIs expuestas con controles debiles, configuraciones inseguras o monitoreo insuficiente sobre trafico real.|{"steps":[{"order":1,"action":"identificar aplicaciones y APIs en produccion expuestas o criticas"},{"order":2,"action":"seleccionar muestra por sensibilidad, exposición y volumen de uso"},{"order":3,"action":"validar autenticacion, autorizacion, protección de endpoints, manejo de errores, límites y monitoreo operativo"},{"order":4,"action":"revisar hallazgos, alertas o eventos del periodo asociados a esas aplicaciones o APIs"},{"order":5,"action":"documentar controles ausentes, exposición innecesaria o debilidad de enforcement"}]}|Inventarios de APIs, gateways, configuraciones, logs, alertas, WAF, hallazgos, tickets, ownership técnico.|Cada caso debe mostrar API o aplicación real, control efectivo y comportamiento operativo observado.|Aquí importa la seguridad del servicio vivo, no la del diseño histórico.|Prueba operativa del plano runtime de aplicaciones y APIs.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000006|4d93e1d3-2b2e-4ab3-a03a-70d81401a791|TST-CYB-CTL078-02|Prueba de tratamiento de hallazgos y anomalias en aplicaciones y APIs en operacion|Evaluar si los hallazgos, eventos o anomalias de seguridad en aplicaciones y APIs se corrigen o contienen de forma efectiva.|La muestra evidencia deteccion, analisis, correccion o contencion y verificacion posterior del estado de la aplicación o API.|Los hallazgos quedan abiertos, se mitigan solo parcialmente o se cierran sin validar el estado final del servicio.|{"steps":[{"order":1,"action":"solicitar hallazgos, incidentes o anomalias del periodo sobre aplicaciones y APIs en produccion"},{"order":2,"action":"seleccionar muestra por criticidad, exposición e impacto potencial"},{"order":3,"action":"validar análisis, acción técnica aplicada, responsable y fecha de cierre"},{"order":4,"action":"confirmar si hubo revalidación funcional o de seguridad posterior a la corrección"},{"order":5,"action":"documentar recurrencias, cierres débiles o degradaciones persistentes"}]}|Hallazgos, tickets, alertas, cronologías, cambios aplicados, revalidaciones, reportes de cierre.|Cada caso debe mostrar problema observado, acción ejecutada y estado final comprobado.|La seguridad de aplicación en operación se prueba por la respuesta a fallos reales del runtime.|Complementa el control de protección activa con efectividad de remediación.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000007|5598bd31-cf49-4ecf-86f9-710fe5ea24c5|TST-CYB-CTL079-01|Prueba operativa de control sobre dependencias y componentes de la cadena de suministro de desarrollo|Verificar que la organizacion conoce y controla componentes, dependencias, artefactos y fuentes externas relevantes que ingresan al proceso de desarrollo y entrega.|La muestra evidencia visibilidad de dependencias y componentes, validacion de origen y tratamiento de riesgos asociados en el ciclo real de entrega.|Existen dependencias opacas, componentes sin visibilidad suficiente o uso de artefactos externos sin control real.|{"steps":[{"order":1,"action":"identificar proyectos o pipelines donde se consuman paquetes, librerias, imagenes, acciones o artefactos externos"},{"order":2,"action":"seleccionar muestra por criticidad, exposición y volumen de dependencia externa"},{"order":3,"action":"validar visibilidad sobre componentes usados, origen, versionado y controles de aceptación"},{"order":4,"action":"revisar hallazgos o eventos del periodo asociados a dependencias o componentes comprometidos o inseguros"},{"order":5,"action":"documentar dependencias desconocidas, sin gobierno o sin tratamiento de riesgo"}]}|SBOM si existe, manifests, lockfiles, pipelines, registros de repositorios, controles de origen, tickets, hallazgos.|Cada caso debe mostrar componente o dependencia real, origen y control aplicado.|La cadena de suministro no falla solo por código propio; falla por lo que entra sin suficiente gobierno.|Prueba operativa principal sobre supply chain de desarrollo.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000008|5598bd31-cf49-4ecf-86f9-710fe5ea24c5|TST-CYB-CTL079-02|Prueba de tratamiento de riesgos y hallazgos de la cadena de suministro de desarrollo|Evaluar si los hallazgos o riesgos asociados a dependencias, artefactos o integraciones del pipeline se corrigen o gobiernan de forma efectiva.|La muestra evidencia análisis, corrección, sustitución o aceptación formal controlada de riesgos de supply chain.|Los riesgos identificados permanecen sin tratamiento, sin decisión formal o se cierran sin prueba suficiente.|{"steps":[{"order":1,"action":"solicitar hallazgos, vulnerabilidades o eventos del periodo relacionados con dependencias, artefactos o pipeline de desarrollo"},{"order":2,"action":"seleccionar muestra por criticidad, exposición y cercanía a despliegue"},{"order":3,"action":"validar decisión tomada sobre cada caso como actualización, bloqueo, reemplazo o excepción formal"},{"order":4,"action":"confirmar ejecución real de la decisión y estado final del componente o pipeline"},{"order":5,"action":"documentar riesgos envejecidos, aceptaciones informales o tratamiento insuficiente"}]}|Hallazgos SCA, tickets, bloqueos de pipeline, actualizaciones, excepciones, revalidaciones, registros de despliegue.|Cada caso debe mostrar el riesgo, la decisión y la ejecución verificable sobre el flujo real.|Aquí se separa visibilidad de supply chain de control efectivo sobre lo que se introduce al software.|Complementa el inventario con capacidad de saneamiento y decisión real.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000009|1c1be334-85a0-468c-8b20-6e81342f51b4|TST-CYB-CTL080-01|Prueba operativa de seguridad efectiva de configuraciones y accesos en entornos cloud|Verificar que los entornos cloud operan con configuraciones seguras, identidades gobernadas y exposición controlada, con enforcement real y no solo baseline declarada.|La muestra evidencia cuentas, suscripciones o proyectos cloud con controles efectivos sobre acceso, configuración y exposición.|Existen configuraciones inseguras, identidades excesivas o recursos expuestos sin tratamiento suficiente en el entorno cloud.|{"steps":[{"order":1,"action":"identificar cuentas, suscripciones, proyectos o tenants cloud relevantes"},{"order":2,"action":"seleccionar muestra por criticidad, exposición y tipo de servicio"},{"order":3,"action":"validar configuraciones de seguridad, identidades, permisos, exposición pública y ownership efectivo"},{"order":4,"action":"revisar hallazgos, alertas o desviaciones del periodo asociados al entorno cloud"},{"order":5,"action":"documentar recursos expuestos, configuraciones inseguras o permisos no justificados"}]}|CSPM, IAM cloud, inventarios, configuraciones, logs, tickets, ownership, hallazgos, evidencias de remediación.|Cada caso debe mostrar recurso o entorno cloud real, configuración efectiva y control operativo observado.|Cloud seguro no es la arquitectura prometida; es el estado real de cuentas, permisos y recursos.|Prueba operativa principal del control cloud.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b16000001-4a22-4d8f-b001-c1a100000010|1c1be334-85a0-468c-8b20-6e81342f51b4|TST-CYB-CTL080-02|Prueba de deteccion y remediacion de desviaciones de seguridad en cloud|Evaluar si las desviaciones de seguridad en cloud se detectan, priorizan y corrigen de forma oportuna y verificable.|La muestra evidencia deteccion, priorizacion, correccion y validacion posterior de hallazgos cloud relevantes.|Las desviaciones permanecen abiertas, se cierran solo administrativamente o se repiten sin aprendizaje ni endurecimiento suficiente.|{"steps":[{"order":1,"action":"solicitar hallazgos, alertas o desviaciones del periodo sobre seguridad cloud"},{"order":2,"action":"seleccionar muestra por criticidad, exposición pública, privilegio o recurrencia"},{"order":3,"action":"validar análisis, owner, acción correctiva y fecha de cierre"},{"order":4,"action":"confirmar revalidación posterior del recurso o configuración afectada"},{"order":5,"action":"documentar recurrencias, tiempos excesivos o cierres sin prueba real"}]}|Hallazgos CSPM, tickets, evidencias de remediación, revalidaciones, ownership, excepciones aprobadas.|Cada caso debe mostrar el antes, la acción aplicada y el estado final comprobado.|Muy alineado con Kiriox: cloud concentra identidad, exposición, automatización y superficie cambiante en un solo plano.|Complementa el estado de configuración con capacidad de corrección sostenida.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
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
  from tmp_cyb_group_16
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
