import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('audit', 'read', async () => {
    return Response.json({
      key: 'dashboard-auditoria',
      label: 'Auditoría',
      generated_at: new Date().toISOString(),
      data: {},
    });
  })
);
