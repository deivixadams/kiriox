begin;

-- obligation_type: fix mojibake and improve wording
update catalog.catalog_item ci
set
  description = case ci.code
    when 'GOVERNANCE' then 'Obligación de gobierno, supervisión, dirección y toma de decisiones institucionales.'
    when 'DESIGN' then 'Obligación de diseño y arquitectura: políticas, metodologías, controles definidos, versionado y reglas.'
    when 'OPERATIONAL' then 'Obligación de ejecución y operación: aplicación real, trazabilidad, SLAs y evidencia operativa.'
    when 'QUANTITATIVE' then 'Obligación cuantitativa: métricas, calibración, desempeño, drift, umbrales y medición objetiva.'
    when 'HARD_GATE' then 'Obligación no compensable: bloqueo, congelamiento o restricción inmediata ante condición crítica.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'obligation_type'
  and ci.code in ('GOVERNANCE','DESIGN','OPERATIONAL','QUANTITATIVE','HARD_GATE');

-- evidence_strength: typo fix
update catalog.catalog_item ci
set
  description = 'Evidencia débil o difícil de verificar.',
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'evidence_strength'
  and ci.code = 'E1';

-- control_automation
update catalog.catalog_item ci
set
  description = case ci.code
    when 'AUTOMATED' then 'Control ejecutado automáticamente por sistema, sin intervención manual en la operación normal.'
    when 'MANUAL' then 'Control ejecutado manualmente por personas, con evidencia operativa trazable.'
    when 'SEMI' then 'Control semiautomatizado que combina automatización con validación o intervención humana.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'control_automation';

-- control_frequency
update catalog.catalog_item ci
set
  description = case ci.code
    when 'CONTINUOUS' then 'Control ejecutado de forma continua o en tiempo casi real.'
    when 'DAILY' then 'Control ejecutado con periodicidad diaria.'
    when 'EVENT' then 'Control ejecutado por evento disparador o condición específica.'
    when 'PERIODIC' then 'Control ejecutado con frecuencia periódica definida.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'control_frequency';

-- control_type
update catalog.catalog_item ci
set
  description = case ci.code
    when 'PREVENTIVO' then 'Control orientado a prevenir la ocurrencia del riesgo.'
    when 'DETECTIVO' then 'Control orientado a detectar oportunamente eventos o desviaciones.'
    when 'CORRECTIVO' then 'Control orientado a corregir, contener o remediar impactos materializados.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'control_type';

-- risk_layer
update catalog.catalog_item ci
set
  description = case ci.code
    when 'STRUCTURAL' then 'Capa estructural del riesgo: dependencias, nodos críticos y fragilidad sistémica.'
    when 'TYPOLOGY' then 'Capa tipológica del riesgo: clasificación por naturaleza y patrón.'
    when 'OPERATIONAL' then 'Capa operativa del riesgo: manifestación en procesos y ejecución diaria.'
    when 'TERMINAL' then 'Capa terminal del riesgo: impacto final materializado sobre negocio, cumplimiento o continuidad.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'risk_layer';

-- risk_type
update catalog.catalog_item ci
set
  description = case ci.code
    when 'STRUCTURAL' then 'Tipo de riesgo de naturaleza estructural, asociado a arquitectura, dependencias y fragilidad sistémica.'
    when 'TYPOLOGY' then 'Tipo de riesgo clasificado por tipología o patrón de materialización.'
    when 'OPERATIONAL' then 'Tipo de riesgo operacional asociado a ejecución, procesos o controles en operación.'
    when 'TERMINAL' then 'Tipo de riesgo terminal asociado al daño final observado en negocio, cumplimiento o continuidad.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'risk_type'
  and ci.code in ('STRUCTURAL','TYPOLOGY','OPERATIONAL','TERMINAL');

-- source_type
update catalog.catalog_item ci
set
  description = case ci.code
    when 'LAW' then 'Fuente normativa de tipo ley.'
    when 'REGULATION' then 'Fuente normativa de tipo regulación o disposición regulatoria.'
    when 'GUIDANCE' then 'Fuente de lineamiento o guía técnica.'
    when 'INTERNAL_POLICY' then 'Fuente normativa interna (política, estándar o procedimiento).'
    when 'OTHER' then 'Fuente de referencia adicional no clasificada en categorías anteriores.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'source_type';

-- status
update catalog.catalog_item ci
set
  description = case ci.code
    when 'DRAFT' then 'Registro en estado borrador, pendiente de aprobación o publicación.'
    when 'ARCHIVED' then 'Registro archivado para referencia histórica; no debe usarse para operación activa.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'status'
  and ci.code in ('DRAFT','ARCHIVED');

-- test_method
update catalog.catalog_item ci
set
  description = case ci.code
    when 'DOCUMENTARY' then 'Método de prueba basado en revisión documental y evidencia formal.'
    when 'OPERATIONAL_REVIEW' then 'Método de prueba basado en revisión operativa en ejecución real.'
    when 'SAMPLING' then 'Método de prueba basado en muestreo representativo de casos o eventos.'
    when 'SCRIPT' then 'Método de prueba ejecutado mediante script o automatización técnica.'
    else ci.description
  end,
  updated_at = now()
from catalog.catalog_group cg
where cg.id = ci.catalog_group_id
  and cg.code = 'test_method';

commit;

