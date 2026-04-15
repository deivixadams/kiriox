-- 20260414_remove_core_fk_to_borrame_catalog_group.sql
-- Objetivo: eliminar dependencia de core.catalog_item hacia borrame._borrame-catalog_group

BEGIN;

CREATE TABLE IF NOT EXISTS core.catalog_group (
  id bigint NOT NULL,
  code character varying,
  name character varying,
  description text,
  applies_to character varying,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'core.catalog_group'::regclass
      AND conname = 'catalog_group_pkey'
  ) THEN
    ALTER TABLE core.catalog_group
      ADD CONSTRAINT catalog_group_pkey PRIMARY KEY (id);
  END IF;
END $$;

INSERT INTO core.catalog_group (id, code, name, description, applies_to, is_active, created_at, updated_at)
SELECT b.id, b.code, b.name, b.description, b.applies_to, COALESCE(b.is_active, true), COALESCE(b.created_at, now()), COALESCE(b.updated_at, now())
FROM borrame."_borrame-catalog_group" b
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    applies_to = EXCLUDED.applies_to,
    is_active = EXCLUDED.is_active,
    updated_at = now();

ALTER TABLE core.catalog_item
  DROP CONSTRAINT IF EXISTS catalog_item_catalog_group_id_fkey;

ALTER TABLE core.catalog_item
  ADD CONSTRAINT catalog_item_catalog_group_id_fkey
  FOREIGN KEY (catalog_group_id)
  REFERENCES core.catalog_group(id)
  ON DELETE CASCADE;

COMMIT;
