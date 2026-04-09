import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('simulation', 'read', async () => {
    return Response.json({
      key: 'dashboard-simulacion',
      label: 'Simulación',
      generated_at: new Date().toISOString(),
      data: {},
    });
  })
);
