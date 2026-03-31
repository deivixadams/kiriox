CREATE OR REPLACE VIEW graph.v_risk_analyst AS
SELECT
  mde.domain_id,
  d.name AS domain_name,

  mer.risk_id,
  r.code AS risk_code,
  r.name AS risk_name,
  r.risk_type,
  r.risk_layer_id,
  r.risk_origen,

  mer.element_id,
  de.code AS element_code,
  COALESCE(de.title, de.name, de.code) AS element_name,
  de.element_type,

  cp.id AS probability_catalog_id,
  cp.code AS probability_code,
  cp.name AS probability_name,
  cp.description AS probability_description,
  cp.base_value::numeric(8,4) AS probability,

  ci.id AS impact_catalog_id,
  ci.code AS impact_code,
  ci.name AS impact_name,
  ci.description AS impact_description,
  ci.base_value::numeric(8,4) AS impact,

  ra.connectivity,
  ra.cascade,
  COALESCE(ra.k_factor, 1)::numeric(8,4) AS k_factor,

  CASE
    WHEN cp.base_value IS NOT NULL
      AND ci.base_value IS NOT NULL
      AND ra.connectivity IS NOT NULL
      AND ra.cascade IS NOT NULL
    THEN (cp.base_value * ci.base_value)::numeric(18,6)
    ELSE NULL
  END AS base_score,

  CASE
    WHEN cp.base_value IS NOT NULL
      AND ci.base_value IS NOT NULL
      AND ra.connectivity IS NOT NULL
      AND ra.cascade IS NOT NULL
    THEN ((cp.base_value * ci.base_value) * (1 + (COALESCE(ra.k_factor, 1) * ra.cascade)))::numeric(18,6)
    ELSE NULL
  END AS risk_score,

  CASE
    WHEN cp.base_value IS NOT NULL
      AND ci.base_value IS NOT NULL
      AND ra.connectivity IS NOT NULL
      AND ra.cascade IS NOT NULL
    THEN (((cp.base_value * ci.base_value) * (1 + (COALESCE(ra.k_factor, 1) * ra.cascade))) - (cp.base_value * ci.base_value))::numeric(18,6)
    ELSE NULL
  END AS delta_score,

  (
    cp.base_value IS NOT NULL
    AND ci.base_value IS NOT NULL
    AND ra.connectivity IS NOT NULL
    AND ra.cascade IS NOT NULL
  ) AS has_real_data,

  NOT (
    cp.base_value IS NOT NULL
    AND ci.base_value IS NOT NULL
    AND ra.connectivity IS NOT NULL
    AND ra.cascade IS NOT NULL
  ) AS is_missing_required_data,

  ra.scenario,
  ra.source,
  ra.analysis_notes,
  ra.created_at,
  ra.updated_at
FROM graph.map_domain_elements_risk mer
JOIN graph.risk r
  ON r.id = mer.risk_id
JOIN graph.domain_elements de
  ON de.id = mer.element_id
JOIN graph.map_domain_element mde
  ON mde.element_id = mer.element_id
JOIN graph.domain d
  ON d.id = mde.domain_id
LEFT JOIN graph.risk_analyst ra
  ON ra.risk_id = mer.risk_id
 AND ra.element_id = mer.element_id
LEFT JOIN catalogos.corpus_catalog_probability cp
  ON cp.is_active = true
 AND cp.base_value = ra.probability
LEFT JOIN catalogos.corpus_catalog_impact ci
  ON ci.is_active = true
 AND ci.base_value = ra.impact;
