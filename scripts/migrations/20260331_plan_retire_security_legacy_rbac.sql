-- 2026-03-31
-- Plan de retiro controlado de tablas legacy RBAC:
--   security.security_rbac
--   security.user_x_rbac
--
-- Este script es NO destructivo por defecto.
-- Objetivo: dejar evidencia, snapshot y checklist técnico antes del corte final.

BEGIN;

CREATE SCHEMA IF NOT EXISTS security_legacy;

CREATE TABLE IF NOT EXISTS security_legacy.retirement_log (
  id            bigserial PRIMARY KEY,
  event_code    text NOT NULL,
  details       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Snapshot estructural: conteo y huella operativa actual de tablas legacy.
INSERT INTO security_legacy.retirement_log(event_code, details)
VALUES (
  'LEGACY_RBAC_SNAPSHOT',
  jsonb_build_object(
    'security_rbac_exists', to_regclass('security.security_rbac') IS NOT NULL,
    'user_x_rbac_exists', to_regclass('security.user_x_rbac') IS NOT NULL,
    'security_rbac_rows', COALESCE((SELECT count(*) FROM security.security_rbac), 0),
    'user_x_rbac_rows', COALESCE((SELECT count(*) FROM security.user_x_rbac), 0),
    'timestamp', now()
  )
);

-- Backup inmutable (si ya existe, no se sobreescribe).
DO $$
BEGIN
  IF to_regclass('security.security_rbac') IS NOT NULL
     AND to_regclass('security_legacy.security_rbac_20260331') IS NULL THEN
    EXECUTE 'CREATE TABLE security_legacy.security_rbac_20260331 AS TABLE security.security_rbac';
  END IF;

  IF to_regclass('security.user_x_rbac') IS NOT NULL
     AND to_regclass('security_legacy.user_x_rbac_20260331') IS NULL THEN
    EXECUTE 'CREATE TABLE security_legacy.user_x_rbac_20260331 AS TABLE security.user_x_rbac';
  END IF;
END $$;

-- Índices mínimos para lectura de respaldo.
CREATE INDEX IF NOT EXISTS idx_security_rbac_20260331_role_code
  ON security_legacy.security_rbac_20260331 (role_code);

CREATE INDEX IF NOT EXISTS idx_user_x_rbac_20260331_user_id
  ON security_legacy.user_x_rbac_20260331 (user_id);

INSERT INTO security_legacy.retirement_log(event_code, details)
VALUES (
  'LEGACY_RBAC_BACKUP_READY',
  jsonb_build_object(
    'backup_security_rbac', to_regclass('security_legacy.security_rbac_20260331') IS NOT NULL,
    'backup_user_x_rbac', to_regclass('security_legacy.user_x_rbac_20260331') IS NOT NULL,
    'timestamp', now()
  )
);

COMMIT;

-- =========================================
-- CHECKLIST PREVIO AL CORTE FINAL (manual)
-- =========================================
-- 1) Verificar cero dependencias en código a security_rbac/user_x_rbac.
-- 2) Verificar endpoints críticos usando modelo canónico:
--    company_user, company_user_role, role, role_permission, permission.
-- 3) Verificar pruebas de autorización y acceso multi-tenant.
-- 4) Verificar rollback: backups en security_legacy completos.
--
-- =========================================
-- CORTE FINAL (NO EJECUTAR SIN VALIDACIÓN)
-- =========================================
-- BEGIN;
--   DROP TABLE IF EXISTS security.user_x_rbac;
--   DROP TABLE IF EXISTS security.security_rbac;
--   INSERT INTO security_legacy.retirement_log(event_code, details)
--   VALUES ('LEGACY_RBAC_DROPPED', jsonb_build_object('timestamp', now()));
-- COMMIT;

