import { PrismaClient } from '@prisma/client';
import { AuditFinding } from './engine-v3';

const prisma = new PrismaClient();

/**
 * Audit Service
 * Handles the automated and manual creation of Audit Findings.
 */

export async function generateFindingFromTestRun(
    testRunId: string,
    evaluationId: string,
    tenantId: string,
    userId: string
) {
    // 1. Fetch the test run and related control/obligation
    const testRun = await (prisma as any).pendiente.test_control_run.findUnique({
        where: { id: testRunId },
        include: {
            control: true,
            test: true
        }
    });

    if (!testRun) throw new Error('Test run not found');

    // 2. Materiality Rule: Only Significant or Critical failures trigger findings
    const materialityThresholds = ['significant', 'critical'];
    if (!materialityThresholds.includes(testRun.result)) {
        return null;
    }

    // 3. Deduction Logic: Find active type and params
    // For v1, we use a default based on result severity
    const defaultTypeCode = testRun.result === 'critical' ? 'CTRL_CRITICAL_FAIL' : 'CTRL_SIG_FAIL';

    const findingType = await (prisma as any).corpusCatalogAuditFindingType.findUnique({
        where: { code: defaultTypeCode }
    });

    if (!findingType) {
        console.warn(`Finding type ${defaultTypeCode} not found. Using system defaults.`);
    }

    // 4. Create Dedupe Key: evaluation_id + control_id + type_code
    // This ensures we only have one OPEN finding for the same issue in the same evaluation
    const dedupeKey = `${evaluationId}:${(testRun as any).control_id}:${defaultTypeCode}`;

    // 5. Create or Update Finding
    const severity = testRun.result === 'critical' ? 5 : 4;
    const exposureFloor = findingType?.defaultExposureFloor || (severity === 5 ? 0.7 : 0.4);
    const readinessPenalty = findingType?.defaultReadinessPenalty || (severity === 5 ? 20 : 10);
    const dueDays = findingType?.defaultDueDays || 30;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (dueDays as number));

    const finding = await (prisma as any).corpusAuditFinding.upsert({
        where: { dedupeKey },
        update: {
            status: 'open',
            evidenceLinks: {
                push: { testRunId: testRunId, date: new Date().toISOString() }
            } as any,
            updatedAt: new Date(),
            updatedBy: userId
        },
        create: {
            tenantId,
            code: `AUDIT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            title: `Falla en Control: ${(testRun as any).control?.name || 'Desconocido'}`,
            description: `Hallazgo detectado automáticamente tras ejecución de prueba ${(testRun as any).test?.code || 'N/A'}. Resultado: ${testRun.result}.`,
            eventTypeId: findingType?.id || '1',
            severity,
            status: 'open',
            exposureFloor,
            readinessPenalty,
            dueDate,
            dedupeKey,
            evaluationId,
            controlId: (testRun as any).control_id,
            testControlRunId: testRunId,
            createdBy: userId,
            evidenceLinks: [{ testRunId: testRunId, date: new Date().toISOString() }] as any,
            severityId: severity,
            statusId: 1
        }
    });

    // 6. Log change
    await (prisma as any).corpusAuditLog.create({
        data: {
            tenantId,
            entityName: 'corpus.audit_finding',
            entityId: finding.id,
            action: 'AUTO_GENERATE',
            newData: finding as any,
            changedBy: userId,
            ipAddress: '127.0.0.1'
        }
    });

    return finding;
}
