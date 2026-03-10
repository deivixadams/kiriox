BEGIN;

-- Rename to mark deprecation while preserving FKs by OID.
ALTER TABLE corpus.framework_version
  RENAME TO "_Delete_framework_version";

COMMIT;
