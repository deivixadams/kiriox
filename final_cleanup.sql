-- 1. Update Role Metadata
UPDATE corpus.security_rbac 
SET role_name = 'Administrador de Seguridad', 
    description = 'Control total sobre la plataforma, usuarios y configuración del sistema.'
WHERE role_code = 'ADMIN';

UPDATE corpus.security_rbac 
SET role_name = 'Operador de Cumplimiento', 
    description = 'Gestión operativa de controles, riesgos y recolección de evidencias.'
WHERE role_code = 'OPERATOR';

UPDATE corpus.security_rbac 
SET role_name = 'Auditor de Riesgos', 
    description = 'Acceso privilegiado para revisión de evidencias, hallazgos y reportes de cumplimiento.'
WHERE role_code = 'AUDITOR';

-- 2. Drop legacy column
ALTER TABLE corpus.security_users DROP COLUMN IF EXISTS role_code;
