import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';
import {
  GetAccessContextUseCase,
  PrismaAccessContextRepository,
} from '@/modules/security';

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const useCase = new GetAccessContextUseCase(new PrismaAccessContextRepository());
  const access = await useCase.execute({
    userId: auth.userId,
    companyId: auth.tenantId,
    fallbackEmail: auth.email,
  });

  return NextResponse.json(access, { status: 200 });
}

