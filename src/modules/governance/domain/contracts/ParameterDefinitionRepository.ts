export type GovernanceParameterDefinition = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  isActive: boolean;
};

export interface ParameterDefinitionRepository {
  listActiveDefinitions(): Promise<GovernanceParameterDefinition[]>;
}
