import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Fetch the profile and its children
        const profile = await (prisma as any).corpusSuperintendence.findUnique({
            where: { id },
            include: {
                eventWeights: true,
                triggerThresholds: true
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (profile.status === 'active') {
            return NextResponse.json({ error: 'Profile is already active' }, { status: 400 });
        }

        // 2. Build canonical object for hashing
        const snapshot = {
            base: {
                alpha: profile.alpha,
                beta: profile.beta,
                gamma: profile.gamma,
                materialMultiplier: profile.materialMultiplier
            },
            events: (profile.eventWeights as any[])
                .sort((a, b) => (a.eventTypeCode || '').localeCompare(b.eventTypeCode || ''))
                .map(e => ({
                    code: e.eventTypeCode,
                    w: e.sensitivityWeight,
                    m: e.severityMultiplier,
                    p: e.readinessPenalty,
                    f: e.exposureFloor,
                    h: e.isHardTrigger
                })),
            triggers: (profile.triggerThresholds as any[])
                .sort((a, b) => (a.triggerCode || '').localeCompare(b.triggerCode || ''))
                .map(t => ({
                    code: t.triggerCode,
                    v: t.thresholdValue,
                    f: t.exposureFloor,
                    e: t.enabled
                }))
        };

        const hash = crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');

        // 3. Transaction: Archive current active and Activate this one
        await (prisma as any).$transaction([
            // Archive current active profile for same company/jurisdiction/framework
            (prisma as any).corpusSuperintendence.updateMany({
                where: {
                    companyId: profile.companyId,
                    jurisdictionId: profile.jurisdictionId,
                    frameworkVersionId: profile.frameworkVersionId,
                    status: 'active'
                },
                data: {
                    status: 'archived',
                    isActive: false
                }
            }),
            // Activate new one
            (prisma as any).corpusSuperintendence.update({
                where: { id },
                data: {
                    status: 'active',
                    isActive: true,
                    hashSnapshot: hash,
                    updatedAt: new Date()
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            id,
            hash,
            message: 'Profile activated successfully'
        });
    } catch (error: any) {
        console.error('Error activating superintendence profile:', error);
        return NextResponse.json({ error: 'Activation failed' }, { status: 500 });
    }
}
