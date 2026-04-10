import GovernanceOntologyPage from '@/modules/governance/ui/pages/GovernanceOntologyPage';
import { GovernanceCloseButton } from '@/shared/ui/GovernanceCloseButton';

export default function Page() {
  return (
    <>
      <GovernanceCloseButton variant="icon" />
      <GovernanceOntologyPage />
    </>
  );
}
