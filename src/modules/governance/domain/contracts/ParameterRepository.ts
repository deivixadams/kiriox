export type GovernanceParameterValue = {
  id: string;
  profileId: string;
  parameterCode: string;
  value: number;
};

export interface ParameterRepository {
  getValuesByProfile(profileId: string): Promise<GovernanceParameterValue[]>;
}
