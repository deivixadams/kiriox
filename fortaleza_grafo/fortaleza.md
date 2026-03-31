
# Problemas de Integridad

## Elementos Sin Conexiones

- Reino sin dominios activos

SELECT
  count(*) AS total_domains,
  count(*) FILTER (
    WHERE coalesce(s.code,'') ILIKE 'active'
      AND coalesce(s.is_active,true)=true
      AND (d.active_from IS NULL OR d.active_from <= current_date)
      AND (d.active_to   IS NULL OR d.active_to   >= current_date)
  ) AS active_domains
FROM core.domain d
JOIN core.map_reino_domain mrd ON mrd.domain_id = d.id
LEFT JOIN catalog.corpus_catalog_status s ON s.id = d.status_id
WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e';


- Dominio sin reino asociado

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
)
SELECT
  count(*) AS total_domains_aml,
  count(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1
      FROM core.map_reino_domain x
      WHERE x.domain_id = d.id
        AND x.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
    )
  ) AS domains_without_reino_asociado_aml
FROM aml_domains d;

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
)
SELECT
  d.id   AS domain_id,
  d.code AS domain_code,
  d.name AS domain_name
FROM aml_domains d
WHERE NOT EXISTS (
  SELECT 1
  FROM core.map_reino_domain x
  WHERE x.domain_id = d.id
    AND x.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
)
ORDER BY d.code;

- Dominios sin elementos

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
)
,
aml_domain_with_elements AS (
  SELECT DISTINCT
    m.domain_id
  FROM core.map_domain_element m
  JOIN core.domain_elements e
    ON e.id = m.element_id
  JOIN aml_domains d
    ON d.id = m.domain_id
)
SELECT
  count(*) AS total_domains_aml,
  count(*) FILTER (
    WHERE x.domain_id IS NULL
  ) AS domains_without_elements_aml
FROM aml_domains d
LEFT JOIN aml_domain_with_elements x
  ON x.domain_id = d.id
;

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
)
,
aml_domain_with_elements AS (
  SELECT DISTINCT
    m.domain_id
  FROM core.map_domain_element m
  JOIN core.domain_elements e
    ON e.id = m.element_id
  JOIN aml_domains d
    ON d.id = m.domain_id
)
SELECT
  d.id   AS domain_id,
  d.code AS domain_code,
  d.name AS domain_name
FROM aml_domains d
LEFT JOIN aml_domain_with_elements x
  ON x.domain_id = d.id
WHERE x.domain_id IS NULL
ORDER BY d.code;

- Elementos sin dominios

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
),
aml_elements AS (
  SELECT DISTINCT
    e.id,
    e.code,
    e.name
  FROM core.domain_elements e
  JOIN core.map_domain_element m
    ON m.element_id = e.id
  JOIN aml_domains d
    ON d.id = m.domain_id
)
SELECT
  count(*) AS total_elements_aml,
  count(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1
      FROM core.map_domain_element m
      JOIN aml_domains d
        ON d.id = m.domain_id
      WHERE m.element_id = e.id
    )
  ) AS elements_without_domain_aml
FROM aml_elements e;

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
),
aml_elements AS (
  SELECT DISTINCT
    e.id,
    e.code,
    e.name
  FROM core.domain_elements e
  JOIN core.map_domain_element m
    ON m.element_id = e.id
  JOIN aml_domains d
    ON d.id = m.domain_id
)
SELECT
  e.id   AS element_id,
  e.code AS element_code,
  e.name AS element_name
FROM aml_elements e
WHERE NOT EXISTS (
  SELECT 1
  FROM core.map_domain_element m
  JOIN aml_domains d
    ON d.id = m.domain_id
  WHERE m.element_id = e.id
)
ORDER BY e.code;

- Elementos sin riesgos

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
),
aml_elements AS (
  SELECT DISTINCT
    e.id,
    e.code,
    e.name
  FROM core.domain_elements e
  JOIN core.map_domain_element m
    ON m.element_id = e.id
  JOIN aml_domains d
    ON d.id = m.domain_id
)
SELECT
  count(*) AS total_elements_aml,
  count(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1
      FROM core.map_domain_elements_risk mer
      WHERE mer.element_id = e.id
    )
  ) AS elements_without_risks_aml
FROM aml_elements e;

WITH aml_domains AS (
  SELECT DISTINCT
    d.id,
    d.code,
    d.name
  FROM core.domain d
  JOIN core.map_reino_domain mrd
    ON mrd.domain_id = d.id
  WHERE mrd.reino_id = '993c14b3-0fa8-4a02-9959-d3850e32a34e'
),
aml_elements AS (
  SELECT DISTINCT
    e.id,
    e.code,
    e.name
  FROM core.domain_elements e
  JOIN core.map_domain_element m
    ON m.element_id = e.id
  JOIN aml_domains d
    ON d.id = m.domain_id
)
SELECT
  e.id   AS element_id,
  e.code AS element_code,
  e.name AS element_name
FROM aml_elements e
WHERE NOT EXISTS (
  SELECT 1
  FROM core.map_domain_elements_risk mer
  WHERE mer.element_id = e.id
)
ORDER BY e.code;

- Elementos sin controles

WITH reinos AS (
  SELECT
    'AML'::text AS reino_code,
    '993c14b3-0fa8-4a02-9959-d3850e32a34e'::uuid AS reino_id
  UNION ALL
  SELECT
    'CYB'::text AS reino_code,
    '706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid AS reino_id
),
reino_domains AS (
  SELECT
    r.reino_code,
    d.id AS domain_id
  FROM reinos r
  JOIN core.map_reino_domain mrd
    ON mrd.reino_id = r.reino_id
  JOIN core.domain d
    ON d.id = mrd.domain_id
),
reino_elements AS (
  SELECT DISTINCT
    rd.reino_code,
    e.id,
    e.code,
    e.name
  FROM reino_domains rd
  JOIN core.map_domain_element mde
    ON mde.domain_id = rd.domain_id
  JOIN core.domain_elements e
    ON e.id = mde.element_id
)
SELECT
  re.reino_code,
  count(*) AS total_elements,
  count(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1
      FROM core.map_domain_elements_control mec
      WHERE mec.element_id = re.id
    )
  ) AS elements_without_controls
FROM reino_elements re
GROUP BY re.reino_code
ORDER BY re.reino_code;

WITH reinos AS (
  SELECT
    'AML'::text AS reino_code,
    '993c14b3-0fa8-4a02-9959-d3850e32a34e'::uuid AS reino_id
  UNION ALL
  SELECT
    'CYB'::text AS reino_code,
    '706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid AS reino_id
),
reino_domains AS (
  SELECT
    r.reino_code,
    d.id AS domain_id,
    d.code AS domain_code,
    d.name AS domain_name
  FROM reinos r
  JOIN core.map_reino_domain mrd
    ON mrd.reino_id = r.reino_id
  JOIN core.domain d
    ON d.id = mrd.domain_id
),
reino_elements AS (
  SELECT DISTINCT
    rd.reino_code,
    rd.domain_id,
    rd.domain_code,
    rd.domain_name,
    e.id,
    e.code,
    e.name
  FROM reino_domains rd
  JOIN core.map_domain_element mde
    ON mde.domain_id = rd.domain_id
  JOIN core.domain_elements e
    ON e.id = mde.element_id
)
SELECT
  re.reino_code,
  re.domain_id,
  re.domain_code,
  re.domain_name,
  re.id   AS element_id,
  re.code AS element_code,
  re.name AS element_name
FROM reino_elements re
WHERE NOT EXISTS (
  SELECT 1
  FROM core.map_domain_elements_control mec
  WHERE mec.element_id = re.id
)
ORDER BY re.reino_code, re.domain_code, re.code;

- Controles sin pruebas
- Pruebas sin evidencias

## Cobertura Insuficiente

- Elementos clave sin cobertura suficiente
- Elementos clave sin riesgos suficientes
- Riesgos clave sin control primario
- Riesgos críticos con controles solo compensatorios
- Elementos críticos sin hard gate cuando debería existir
- Riesgos críticos sin cobertura suficiente

## Inflación de Datos

- Inflado de riesgos
- Inflado de controles
- Inflado de elementos
- Inflado de pruebas

# Consistencia de Criticidad

- Riesgo crítico mal conectado a controles de baja jerarquía
- Control crítico sin peso estructural asignado
- Nodos críticos sin centralidad esperada
- Concentración excesiva de riesgo en un solo dominio
- Concentración excesiva en pocos controles
- Single points of failure no compensados

# Coherencia del Reino

- Dominio asignado al reino incorrecto
- Elemento de un reino conectado a riesgo de otro
- Controles compartidos entre reinos sin política de reutilización
- Dependencias cross-reino no declaradas
- Rutas que salen del reino y regresan sin justificación
