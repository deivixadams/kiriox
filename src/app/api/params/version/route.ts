import { postCreateParamsVersionHandler } from '@/modules/governance/api/handlers';

export async function POST(request: Request) {
  return postCreateParamsVersionHandler(request);
}
