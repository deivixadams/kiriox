export type ModuleCode =
  | 'core'
  | 'governance'
  | 'security'
  | 'benchmark'
  | 'linear-risk'
  | 'structural-risk'
  | 'audit'
  | 'alerts'
  | 'simulation';

export type AccessRequirement = {
  module: ModuleCode;
  permission: string;
};

export type AccessDecisionInput = {
  userId: string;
  companyId: string;
  module: ModuleCode;
  permission: string;
};

