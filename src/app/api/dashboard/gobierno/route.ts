import { nextHandler, withModuleAccess } from '@/shared/http';

export const GET = nextHandler(
  withModuleAccess('governance', 'read', async () => {
    return Response.json({
      key: 'dashboard-gobierno',
      label: 'Gobierno',
      generated_at: new Date().toISOString(),
      data: {},
    });
  })
);
