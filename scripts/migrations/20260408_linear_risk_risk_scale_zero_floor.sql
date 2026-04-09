-- 20260408_linear_risk_risk_scale_zero_floor.sql
-- Objetivo: permitir residual < 1 ajustando banda VERY_LOW para cubrir desde 0.

BEGIN;

UPDATE linear_risk.risk_scale
SET min_value = 0
WHERE is_active = true
  AND UPPER(code) = 'VERY_LOW'
  AND UPPER(applies_to) IN ('ALL', 'RESIDUAL', 'INHERENT')
  AND min_value > 0;

COMMIT;
