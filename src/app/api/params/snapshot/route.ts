import { postCreateParamsSnapshotHandler } from '@/modules/governance/api/handlers';

export async function POST(request: Request) {
  return postCreateParamsSnapshotHandler(request);
}
