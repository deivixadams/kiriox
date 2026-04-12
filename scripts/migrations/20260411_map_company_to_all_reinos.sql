-- Ensure one company is mapped to all realms in core.reino.
-- Idempotent: re-running should not create duplicate links.

DO $$
DECLARE
  v_company_id uuid := '7e01c523-0f3d-4f0c-b5b2-ce95b582c97b';
BEGIN
  -- Reactivate existing mappings for this company.
  UPDATE core.map_company_x_reino
  SET
    is_active = true,
    updated_at = now()
  WHERE company_id = v_company_id
    AND is_active = false;

  -- Insert missing mappings (one per reino).
  INSERT INTO core.map_company_x_reino (
    id,
    company_id,
    reino_id,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    v_company_id,
    r.id,
    true,
    now(),
    now()
  FROM core.reino r
  WHERE NOT EXISTS (
    SELECT 1
    FROM core.map_company_x_reino m
    WHERE m.company_id = v_company_id
      AND m.reino_id = r.id
  );
END $$;

