import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';

export async function GET() {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        userId: auth.userId,
        tenantId: auth.tenantId,
        roleCode: auth.roleCode,
        email: auth.email
    });
}
