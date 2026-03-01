import crypto from 'crypto';

type DraftRecord = {
  id: string;
  step: number;
  jurisdictionId?: string | null;
  frameworkId?: string | null;
  frameworkVersionId?: string | null;
  companyId?: string | null;
  acta?: any;
  scopeConfig?: any;
  objectives?: any;
  team?: any;
  questionnaire?: any;
  guide?: any;
  manualExtensions?: any;
  windowStart?: string | null;
  windowEnd?: string | null;
  createdAt: string;
  updatedAt: string;
};

type DraftStore = Map<string, DraftRecord>;

const globalForDrafts = globalThis as unknown as { auditDraftStore?: DraftStore };

const store: DraftStore = globalForDrafts.auditDraftStore ?? new Map();
if (!globalForDrafts.auditDraftStore) {
  globalForDrafts.auditDraftStore = store;
}

export function createDraft() {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const draft: DraftRecord = { id, step: 1, createdAt: now, updatedAt: now };
  store.set(id, draft);
  return draft;
}

export function getDraft(id: string) {
  return store.get(id) || null;
}

export function updateDraft(id: string, patch: Partial<DraftRecord>) {
  const existing = store.get(id);
  if (!existing) return null;
  const updated: DraftRecord = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  store.set(id, updated);
  return updated;
}
