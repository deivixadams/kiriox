-- Paso 1: Agregar columnas y flexibilizar legacy columns
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS role_name VARCHAR(100);
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP;

-- Hacer que permission_code sea opcional ya que no lo usaremos en la tabla de ROLES
ALTER TABLE corpus.security_rbac ALTER COLUMN permission_code DROP NOT NULL;

ALTER TABLE corpus.security_users ADD COLUMN IF NOT EXISTS role_id UUID;
