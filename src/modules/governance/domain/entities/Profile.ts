export type ProfileStatus = 'DRAFT' | 'APPROVED' | 'ARCHIVED';

export type Profile = {
  id: string;
  companyId: string;
  name: string;
  status: ProfileStatus;
  version: number;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
