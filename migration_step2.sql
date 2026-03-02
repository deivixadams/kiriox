-- Paso 2: Limpieza y Migración de Datos
SET search_path TO corpus;

-- Eliminar duplicados si los hay (basados en role_code)
DELETE FROM corpus.security_rbac a
USING corpus.security_rbac b
WHERE a.id > b.id AND a.role_code = b.role_code;

-- Asegurar restricción única
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_rbac_role_code_key') THEN
        ALTER TABLE corpus.security_rbac ADD CONSTRAINT security_rbac_role_code_key UNIQUE (role_code);
    END IF;
END $$;

-- Insertar roles desde los usuarios actuales
INSERT INTO corpus.security_rbac (role_code, role_name, is_active)
SELECT DISTINCT role_code, role_code, true 
FROM corpus.security_users 
WHERE role_code IS NOT NULL
ON CONFLICT (role_code) DO NOTHING;

-- Mapear IDs de roles a los usuarios
UPDATE corpus.security_users u
SET role_id = r.id
FROM corpus.security_rbac r
WHERE u.role_code = r.role_code
AND u.role_id IS NULL;

-- Paso 3: Crear tabla de relación muchos-a-muchos
CREATE TABLE IF NOT EXISTS corpus.user_x_rbac (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_x_rbac_pkey PRIMARY KEY (id),
    CONSTRAINT user_x_rbac_user_role_unique UNIQUE (user_id, role_id),
    CONSTRAINT user_x_rbac_userId_fkey FOREIGN KEY (user_id) REFERENCES corpus.security_users(id) ON DELETE CASCADE,
    CONSTRAINT user_x_rbac_roleId_fkey FOREIGN KEY (role_id) REFERENCES corpus.security_rbac(id) ON DELETE CASCADE
);

-- Poblar tabla de relación con la asignación actual
INSERT INTO corpus.user_x_rbac (user_id, role_id)
SELECT id, role_id FROM corpus.security_users WHERE role_id IS NOT NULL
ON CONFLICT (user_id, role_id) DO NOTHING;
