-- Convert params.profile.info and params.parameter_definition.info to jsonb
-- Preserve existing text by wrapping in { "summary": "<text>" }

ALTER TABLE params.profile
  ALTER COLUMN info TYPE jsonb
  USING (
    CASE
      WHEN info IS NULL THEN NULL
      ELSE jsonb_build_object('summary', info::text)
    END
  );

ALTER TABLE params.parameter_definition
  ALTER COLUMN info TYPE jsonb
  USING (
    CASE
      WHEN info IS NULL THEN NULL
      ELSE jsonb_build_object('summary', info::text)
    END
  );
