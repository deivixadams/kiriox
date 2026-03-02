-- Ensure all 6 roles exist with their specific metadata
-- Using UPSERT logic (INSERT ... ON CONFLICT)

INSERT INTO corpus.security_rbac (role_code, role_name, description, is_active)
VALUES 
('ADMIN', 'Administrador', 'Control total del sistema. Permisos: Gestionar usuarios y roles, Gestionar información de empresa, Gestionar facturación, Configurar corpus y versiones, Activar/desactivar verticales, Gestionar conexiones de datos, Gestionar dashboards, Crear / editar / eliminar métricas, Mover y redimensionar métricas, Exportar datos, Crear auditorías, Asignar equipo de auditoría, Reabrir auditorías (forzado), Eliminar auditorías draft, Ver todo (draft y definitivo), Acceso a evidencias, Configurar almacenamiento.', true),
('READER', 'Lector', 'Acceso de solo consulta. Permisos: Ver dashboards, Ver métricas, Ver auditorías cerradas, Ver hallazgos cerrados, Ver informes finales, Descargar reportes publicados. No puede: Crear, Editar, Subir evidencia, Exportar datos crudos, Ver auditorías en draft.', true),
('AUDITOR', 'Auditor', 'Ejecutor de auditoría. Permisos: Crear auditorías (si se le asigna), Editar auditorías draft, Registrar evaluaciones, Crear hallazgos, Editar hallazgos draft, Subir evidencia, Crear addendum, Ver respuesta del auditado, Generar borrador de informe, Exportar datos de su auditoría, Ver dashboards. No puede: Cerrar auditoría, Reabrir auditoría cerrada, Gestionar usuarios, Cambiar versión de corpus una vez iniciado.', true),
('LEAD_AUDITOR', 'Auditor Líder', 'Responsable formal de la auditoría. Permisos: Todo lo que puede hacer Auditor, Seleccionar corpus y versión, Asignar equipo, Enviar hallazgos al auditado, Aprobar respuestas, Cerrar auditoría, Generar informe final, Autorizar promoción a definitivo, Reabrir auditoría (si política lo permite), Exportar auditoría completa.', true),
('AML_JUNIOR', 'AML Junior', 'Analista AML operativo. Permisos: Ejecutar evaluaciones AML, Registrar análisis, Crear alertas / observaciones, Subir evidencia AML, Crear hallazgos AML (si aplica), Ver dashboards AML, Exportar datos AML propios. No puede: Cerrar auditorías, Modificar corpus, Asignar equipo, Reabrir auditoría.', true),
('AML_SENIOR', 'AML Senior', 'Responsable AML. Permisos: Todo lo que puede AML Junior, Aprobar análisis AML, Validar hallazgos AML, Escalar a auditoría formal, Generar reportes AML, Exportar datasets AML, Participar como experto en auditoría, Autorizar planes de acción AML.', true)
ON CONFLICT (role_code) DO UPDATE 
SET role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = NOW();

-- Deactivate any other roles that are not in this list
UPDATE corpus.security_rbac 
SET is_active = false 
WHERE role_code NOT IN ('ADMIN', 'READER', 'AUDITOR', 'LEAD_AUDITOR', 'AML_JUNIOR', 'AML_SENIOR');
