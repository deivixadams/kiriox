import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  GetLicenseDashboardUseCase,
  RenewLicenseUseCase,
  UploadLicenseUseCase,
  ValidateLicenseUseCase,
} from '@/modules/governance/application/use-cases';
import { PrismaLicenseManagementRepository } from '@/modules/governance/infrastructure/repositories';
import { ApiError } from '@/shared/http';

const ADMIN_ROLE_CODES = new Set(['ADMIN', 'company_admin', 'COMPANY_ADMIN']);

function assertAdmin(roleCode: string) {
  if (!ADMIN_ROLE_CODES.has(roleCode)) {
    throw ApiError.forbidden('License management is restricted to admin users');
  }
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase();
}

function getLicenseStorageRoot() {
  return path.resolve(process.cwd(), 'xdata', 'licenses');
}

export async function getGovernanceLicenseDashboardHandler(access: {
  companyId: string;
  roleCode: string;
}) {
  assertAdmin(access.roleCode);

  const useCase = new GetLicenseDashboardUseCase(new PrismaLicenseManagementRepository());
  const dashboard = await useCase.execute(access.companyId);
  return Response.json(dashboard);
}

export async function postGovernanceLicenseUploadHandler(
  request: Request,
  access: { companyId: string; userId: string; roleCode: string }
) {
  assertAdmin(access.roleCode);

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    throw ApiError.badRequest('file is required');
  }

  const text = await file.text();
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(text);
  } catch {
    throw ApiError.badRequest('License file must be valid JSON');
  }

  const planCode = String(payload.planCode ?? '').trim();
  const planName = String(payload.planName ?? '').trim();
  const expiresAt = String(payload.expiresAt ?? '').trim();
  const allowedModules = toStringArray(payload.allowedModules);

  if (!planCode || !planName || !expiresAt) {
    throw ApiError.badRequest('License payload requires planCode, planName and expiresAt');
  }

  const expiresDate = new Date(expiresAt);
  if (Number.isNaN(expiresDate.getTime())) {
    throw ApiError.badRequest('Invalid expiresAt date in license payload');
  }

  const limitsPayload = parseJsonRecord(payload.limits);
  const limits = {
    maxUsers: parseOptionalInt(limitsPayload.maxUsers),
    maxRunsMonthly: parseOptionalInt(limitsPayload.maxRunsMonthly),
    maxStorageGb: parseOptionalInt(limitsPayload.maxStorageGb),
    maxModules: parseOptionalInt(limitsPayload.maxModules),
  };

  const contentBuffer = Buffer.from(text, 'utf8');
  const fileHash = createHash('sha256').update(contentBuffer).digest('hex');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName = sanitizeFileName(file.name || 'license.json');
  const companyDir = path.join(getLicenseStorageRoot(), access.companyId);
  const filePath = path.join(companyDir, `${stamp}-${safeName}`);

  await mkdir(companyDir, { recursive: true });
  await writeFile(filePath, contentBuffer);

  const useCase = new UploadLicenseUseCase(new PrismaLicenseManagementRepository());
  const dashboard = await useCase.execute({
    companyId: access.companyId,
    performedBy: access.userId,
    fileName: file.name || safeName,
    filePath,
    fileHash,
    planCode,
    planName,
    licenseKey: payload.licenseKey ? String(payload.licenseKey) : null,
    issuedAt: payload.issuedAt ? String(payload.issuedAt) : null,
    expiresAt: expiresDate.toISOString(),
    allowedModules,
    limits,
    metadata: {
      source: 'uploaded-file',
      raw: payload,
    },
  });

  return Response.json(dashboard, { status: 201 });
}

export async function postGovernanceLicenseValidateHandler(access: {
  companyId: string;
  userId: string;
  roleCode: string;
}) {
  assertAdmin(access.roleCode);

  const useCase = new ValidateLicenseUseCase(new PrismaLicenseManagementRepository());
  const result = await useCase.execute(access.companyId, access.userId);
  return Response.json(result);
}

export async function postGovernanceLicenseRenewHandler(
  request: Request,
  access: { companyId: string; userId: string; roleCode: string }
) {
  assertAdmin(access.roleCode);

  const body = (await request.json()) as {
    expiresAt?: string;
    allowedModules?: string[];
    limits?: {
      maxUsers?: number | null;
      maxRunsMonthly?: number | null;
      maxStorageGb?: number | null;
      maxModules?: number | null;
    };
    notes?: string;
  };

  const expiresAt = String(body.expiresAt ?? '').trim();
  if (!expiresAt) {
    throw ApiError.badRequest('expiresAt is required');
  }

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest('Invalid expiresAt date');
  }

  const useCase = new RenewLicenseUseCase(new PrismaLicenseManagementRepository());
  const dashboard = await useCase.execute({
    companyId: access.companyId,
    performedBy: access.userId,
    expiresAt: date.toISOString(),
    allowedModules: Array.isArray(body.allowedModules)
      ? body.allowedModules.map((v) => String(v).trim()).filter(Boolean)
      : undefined,
    limits: body.limits,
    notes: body.notes,
  });

  return Response.json(dashboard);
}
