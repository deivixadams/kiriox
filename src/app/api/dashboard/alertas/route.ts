import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('alerts', 'read', async () => {
    return Response.json({
      key: 'dashboard-alertas',
      label: 'Alertas',
      generated_at: new Date().toISOString(),
      data: {},
    });
  })
);
