import type { ProfileRepository } from '@/modules/governance/domain/contracts';

export class ApproveProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(profileId: string, approvedBy: string) {
    return this.profileRepository.approveProfile(profileId, approvedBy);
  }
}
