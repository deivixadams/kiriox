import { getActiveParamsProfileHandler } from '@/modules/governance/api/handlers';

export async function GET() {
  return getActiveParamsProfileHandler();
}
