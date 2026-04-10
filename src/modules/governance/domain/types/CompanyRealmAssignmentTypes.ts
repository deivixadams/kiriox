export type GovernanceRealmOption = {
  id: string;
  code: string;
  name: string;
  description: string;
};

export type GovernanceCompanyRealmMapping = {
  id: string;
  companyId: string;
  reinoId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceCompanyRealmContext = {
  companies: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  realms: GovernanceRealmOption[];
};

export type GovernanceCompanyRealmSelection = {
  companyId: string;
  activeRealmIds: string[];
  activeMappings: GovernanceCompanyRealmMapping[];
};

export type SaveCompanyRealmSelectionInput = {
  companyId: string;
  realmIds: string[];
  updatedBy: string;
};

export type SaveCompanyRealmSelectionResult = {
  company: {
    id: string;
    code: string;
    name: string;
  };
  selectedRealmIds: string[];
  activeMappings: GovernanceCompanyRealmMapping[];
};

