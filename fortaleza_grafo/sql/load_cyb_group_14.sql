begin;

drop table if exists xdata.backup_control_eval_before_cyb_insert_batch14_20260329;
create table xdata.backup_control_eval_before_cyb_insert_batch14_20260329 as
select *
from core.control_evaluation_catalog;

create temp table tmp_cyb_group_14 (
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

copy tmp_cyb_group_14
from stdin
with (format text, delimiter '|', null 'NULL');
b14000001-4a22-4d8f-b001-c1a100000001|07cf09df-40ab-4ff1-89ce-374111cdfda1|TST-CYB-CTL066-01|Prueba operativa de revision de arquitectura segura en iniciativas criticas|Verificar que las iniciativas, aplicaciones o cambios relevantes pasan por una revision de arquitectura segura que influye decisiones reales antes del despliegue.|La muestra evidencia revisiones de arquitectura realizadas a tiempo, con hallazgos claros, decisiones registradas y tratamiento verificable.|La revision ocurre tarde, no cubre iniciativas criticas o no produce efecto real sobre el diseño o la liberacion.|{"steps":[{"order":1,"action":"seleccionar proyectos, sistemas o cambios recientes con impacto relevante en riesgo o exposición"},{"order":2,"action":"solicitar artefactos de arquitectura, registros de revisión y decisiones asociadas"},{"order":3,"action":"validar si la revisión ocurrió antes de la liberación o decisión irreversible"},{"order":4,"action":"identificar hallazgos, observaciones, restricciones o requisitos emitidos"},{"order":5,"action":"confirmar si esos hallazgos se tradujeron en cambios, mitigaciones o excepciones formales"},{"order":6,"action":"documentar revisiones nominales, tardías o sin efecto operativo"}]}|Diagramas, ADRs, tickets, actas de revisión, hallazgos, decisiones, excepciones, evidencias de remediación.|Cada caso debe mostrar fecha de revisión, alcance, hallazgos y efecto verificable sobre el diseño o la liberación.|Priorizar integraciones externas, identidad, datos sensibles, componentes expuestos, cloud y servicios críticos.|La revisión de arquitectura vale por su efecto real, no por la reunión celebrada.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000002|07cf09df-40ab-4ff1-89ce-374111cdfda1|TST-CYB-CTL066-02|Prueba de cierre y gobernanza de hallazgos de arquitectura segura|Evaluar si los hallazgos de arquitectura segura se corrigen o quedan bajo excepcion formal controlada antes de exponer el sistema al riesgo.|Los hallazgos revisados muestran remediacion verificable o excepcion formal aprobada con vigencia y compensacion.|Los hallazgos quedan abiertos, se cierran sin prueba o se ignoran en despliegues posteriores.|{"steps":[{"order":1,"action":"solicitar hallazgos de arquitectura segura emitidos en el periodo"},{"order":2,"action":"seleccionar muestra por criticidad, antiguedad y cercania a despliegue"},{"order":3,"action":"validar evidencia de remediacion o aceptacion formal del riesgo"},{"order":4,"action":"confirmar el estado final del sistema desplegado respecto del hallazgo"},{"order":5,"action":"documentar hallazgos envejecidos, aceptaciones informales o cierres sin sustento"}]}|Hallazgos, tickets, excepciones, approvals, evidencias técnicas, registros de despliegue, validaciones posteriores.|Cada hallazgo debe ser trazable hasta corrección o excepción formal con evidencia suficiente.|Un hallazgo arquitectónico abierto puede ser un punto de ruptura sistémico, no un detalle técnico.|Conecta arquitectura con control material del riesgo.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000003|5dd7adaa-4e32-4e2f-a5ed-e1512b8c88f9|TST-CYB-CTL067-01|Prueba operativa de aplicacion de practicas de codificacion segura en desarrollo real|Verificar que las practicas de codificacion segura se aplican en el trabajo real de desarrollo y no solo en guias o capacitaciones.|La muestra evidencia uso real de patrones seguros, revisiones, linters, reglas, checklists o controles que afectan el codigo entregado.|Las practicas seguras no aparecen en el flujo real, se aplican de forma inconsistente o no dejan evidencia verificable.|{"steps":[{"order":1,"action":"seleccionar muestra de repositorios, pull requests o cambios recientes en aplicaciones relevantes"},{"order":2,"action":"revisar evidencia de revisiones de código, checklists, comentarios, reglas o gates aplicados"},{"order":3,"action":"validar si se identificaron y corrigieron prácticas inseguras antes del merge o despliegue"},{"order":4,"action":"comparar entre equipos o repositorios para detectar consistencia o ausencia de práctica real"},{"order":5,"action":"documentar aplicación nominal, inconsistente o inexistente de codificación segura"}]}|Pull requests, comentarios de revisión, reglas de linter o SAST, checklists, tickets de corrección, evidencias de merge controlado.|Cada caso debe mostrar cómo una práctica segura afectó o condicionó el cambio real.|La codificación segura no se prueba por la guía publicada, sino por el diff intervenido.|Prueba operativa fuerte sobre el trabajo real del desarrollador.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000004|5dd7adaa-4e32-4e2f-a5ed-e1512b8c88f9|TST-CYB-CTL067-02|Prueba de tratamiento de debilidades de codificacion detectadas en el ciclo de desarrollo|Evaluar si las debilidades de codificacion detectadas se corrigen de forma efectiva y no se arrastran sin control entre iteraciones o liberaciones.|Las debilidades revisadas muestran correccion verificable o excepcion formal con control suficiente.|Las debilidades se ignoran, se posponen indefinidamente o se cierran sin prueba de correccion real.|{"steps":[{"order":1,"action":"solicitar hallazgos de revisión de código, SAST u otras fuentes ligadas a codificación segura"},{"order":2,"action":"seleccionar muestra por severidad, recurrencia o cercania a despliegue"},{"order":3,"action":"validar evidencia de corrección en código, cierre técnico o excepción formal"},{"order":4,"action":"confirmar si el artefacto liberado quedó en el estado registrado"},{"order":5,"action":"documentar hallazgos repetitivos, envejecidos o resueltos solo formalmente"}]}|Hallazgos, PRs, commits, tickets, SAST, evidencias de cierre, excepciones aprobadas.|Cada hallazgo debe poder seguirse desde detección hasta estado final del cambio liberado.|Aquí se prueba si la organización corrige defectos o simplemente los administra en backlog.|Complementa la práctica con efectividad real sobre debilidades detectadas.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000005|f08a7831-2216-4996-a342-410cf6d4dc0a|TST-CYB-CTL068-01|Prueba operativa de ejecucion de pruebas de seguridad sobre cambios y aplicaciones relevantes|Verificar que las pruebas de seguridad se ejecutan realmente sobre aplicaciones o cambios relevantes y generan decisiones verificables antes de liberar.|La muestra evidencia pruebas ejecutadas, hallazgos analizados y decisiones registradas sobre el despliegue o corrección.|Las pruebas no se ejecutan, se ejecutan fuera de tiempo o no influyen en la liberación ni en el tratamiento del riesgo.|{"steps":[{"order":1,"action":"seleccionar aplicaciones, cambios o versiones liberadas en el periodo"},{"order":2,"action":"solicitar evidencia de pruebas de seguridad asociadas como SAST, DAST, SCA, pentest o revisiones manuales"},{"order":3,"action":"validar fecha, alcance, resultado y vínculo con la liberación correspondiente"},{"order":4,"action":"confirmar si los hallazgos derivados produjeron corrección, excepción o bloqueo del despliegue"},{"order":5,"action":"documentar pruebas tardías, parciales o irrelevantes para la decisión operativa"}]}|Resultados de pruebas, reportes, pipelines, approvals, tickets, hallazgos, excepciones, despliegues.|Cada caso debe demostrar que la prueba ocurrió sobre el artefacto o cambio relevante y antes de liberar o aceptar riesgo.|Probar por probar no sirve; importa el efecto sobre la decisión de release.|Prueba operativa principal del control de testing de seguridad.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000006|f08a7831-2216-4996-a342-410cf6d4dc0a|TST-CYB-CTL068-02|Prueba de suficiencia y cierre de hallazgos derivados de pruebas de seguridad|Evaluar si los hallazgos de pruebas de seguridad son suficientes para concluir sobre el riesgo y si su cierre es verificable.|Los hallazgos muestreados muestran clasificación razonable, evidencia técnica y corrección o aceptación formal sustentada.|Los hallazgos se cierran sin prueba, la severidad no es consistente o la evidencia no permite concluir adecuadamente.|{"steps":[{"order":1,"action":"solicitar hallazgos de pruebas de seguridad del periodo"},{"order":2,"action":"seleccionar muestra por criticidad, fuente de prueba y antiguedad"},{"order":3,"action":"validar evidencia técnica, clasificación, impacto y decisión sobre cada hallazgo"},{"order":4,"action":"confirmar si hubo revalidación posterior al cierre cuando aplicaba"},{"order":5,"action":"documentar cierres débiles, hallazgos mal clasificados o sin trazabilidad suficiente"}]}|Reportes de hallazgos, evidencias técnicas, tickets, revalidaciones, excepciones, criterios de clasificación.|Cada hallazgo debe mostrar base técnica suficiente y un estado final comprobable.|Aquí se prueba calidad de la prueba y calidad del cierre, no solo existencia de un reporte.|Complementa la ejecución de testing con su efecto real sobre riesgo y release.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000007|46eb1ad8-3b5c-487d-ac27-f453885cad2e|TST-CYB-CTL069-01|Prueba operativa de control de seguridad sobre desarrollo subcontratado|Verificar que el desarrollo subcontratado opera bajo requisitos, controles y evidencias de seguridad equivalentes al nivel esperado por la organizacion.|La muestra evidencia requisitos claros, seguimiento real, entregables controlados y validaciones de seguridad sobre trabajo subcontratado.|El proveedor desarrolla sin controles equivalentes, sin seguimiento real o sin evidencia verificable del cumplimiento exigido.|{"steps":[{"order":1,"action":"identificar proveedores o terceros que desarrollan, mantienen o modifican software para la organizacion"},{"order":2,"action":"seleccionar muestra de proyectos o entregables subcontratados recientes"},{"order":3,"action":"validar requisitos de seguridad contractuales y operativos aplicables a cada caso"},{"order":4,"action":"revisar si hubo seguimiento, validaciones, pruebas y control sobre el entregable antes de aceptarlo"},{"order":5,"action":"documentar trabajo recibido sin evidencia suficiente de control de seguridad"}]}|Contratos, anexos, checklists de onboarding, tickets, entregables, resultados de pruebas, actas de aceptación, evidencias de seguimiento.|Cada caso debe mostrar proveedor, entregable, control exigido y evidencia real de cumplimiento o validación.|Subcontratar desarrollo no transfiere el riesgo; solo mueve el punto de ejecución.|Prueba principal del control sobre terceros en SDLC.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000008|46eb1ad8-3b5c-487d-ac27-f453885cad2e|TST-CYB-CTL069-02|Prueba de aceptacion segura y cierre de brechas en entregables subcontratados|Evaluar si los entregables de desarrollo subcontratado se aceptan solo cuando las brechas de seguridad se corrigen o quedan formalmente gobernadas.|Los entregables muestreados muestran revisión, hallazgos tratados y aceptación sustentada con evidencia suficiente.|Se aceptan entregables con brechas sin gobierno formal o sin validación técnica suficiente.|{"steps":[{"order":1,"action":"solicitar entregables subcontratados aceptados en el periodo y sus revisiones asociadas"},{"order":2,"action":"seleccionar muestra por criticidad y exposición del sistema entregado"},{"order":3,"action":"validar hallazgos detectados, evidencia de corrección o excepciones aprobadas"},{"order":4,"action":"confirmar la fecha y condición de aceptación frente al estado real de las brechas"},{"order":5,"action":"documentar aceptaciones débiles, apresuradas o inconsistentes con el riesgo residual"}]}|Actas de aceptación, hallazgos, tickets, revalidaciones, excepciones, evidencias técnicas, criterios de aceptación.|Cada caso debe mostrar vínculo entre hallazgo, corrección o excepción y acto de aceptación.|La aceptación sin control real convierte al tercero en origen silencioso de fragilidad.|Complementa el gobierno del proveedor con la decisión final de recepción.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000009|79609efb-a01d-4356-81be-a038172bd4c2|TST-CYB-CTL070-01|Prueba operativa de separacion efectiva de entornos|Verificar que los entornos de desarrollo, prueba y produccion se mantienen realmente separados en acceso, datos, configuracion y despliegue.|La muestra evidencia separacion efectiva, accesos diferenciados, controles de paso y ausencia de mezcla no justificada entre entornos.|Existen accesos cruzados amplios, reutilizacion indebida, mezcla de datos o cambios directos que debilitan la separación declarada.|{"steps":[{"order":1,"action":"identificar entornos relevantes y sus controles esperados de separacion"},{"order":2,"action":"seleccionar muestra de sistemas o aplicaciones por criticidad"},{"order":3,"action":"validar accesos, rutas de despliegue, configuraciones, datos y conectividad entre entornos"},{"order":4,"action":"revisar si existen cuentas compartidas, cambios directos o reutilización de activos no justificada"},{"order":5,"action":"documentar mezcla de entorno o separación solo nominal"}]}|Matrices de acceso, pipelines, configuraciones, inventarios, evidencias de despliegue, políticas, hallazgos, tickets.|Cada caso debe demostrar separación real en acceso, despliegue y tratamiento de datos o configuraciones.|La separación de entornos vale por la barrera efectiva, no por el nombre del servidor.|Prueba base del aislamiento operativo entre etapas del SDLC.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
b14000001-4a22-4d8f-b001-c1a100000010|79609efb-a01d-4356-81be-a038172bd4c2|TST-CYB-CTL070-02|Prueba de control de excepciones y puentes entre entornos|Evaluar si las conexiones, accesos o puentes excepcionales entre entornos se aprueban, limitan y monitorean sin erosionar la separación requerida.|La muestra evidencia excepciones formales, temporales, justificadas y con controles compensatorios o cierre posterior.|Existen puentes permanentes, accesos amplios o excepciones informales que anulan la separación de entornos.|{"steps":[{"order":1,"action":"solicitar registro de excepciones, puentes o accesos especiales entre entornos"},{"order":2,"action":"seleccionar muestra por criticidad, antiguedad y amplitud del acceso"},{"order":3,"action":"validar aprobación, justificación, vigencia, monitoreo y compensación cuando aplique"},{"order":4,"action":"confirmar si el puente sigue activo y si su necesidad actual es válida"},{"order":5,"action":"documentar excepciones envejecidas, informales o estructuralmente peligrosas"}]}|Registros de excepciones, tickets, configuraciones, approvals, evidencias de monitoreo, cierres o renovaciones.|Cada caso debe mostrar trazabilidad completa desde habilitación hasta cierre o reevaluación formal.|El puente entre entornos es una de las rutas más comunes de contagio entre capas técnicas.|Muy alineado con Kiriox: evita acoplamiento oculto y fragilidad transversal.|draft|true|NULL|2026-03-29 00:00:00|NULL|2026-03-29 00:00:00|2026-03-29 00:00:00
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
  from tmp_cyb_group_14
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
