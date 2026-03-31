export type CreateProfileInput = {
  companyId: string;
  name: string;
  createdBy: string;
};

export type ApproveProfileInput = {
  profileId: string;
  approvedBy: string;
};

export type CreateSnapshotInput = {
  profileId: string;
  runId?: string | null;
};
