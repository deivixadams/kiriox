import type { ProfileRepository } from '@/modules/governance/domain/contracts';
import type { Profile } from '@/modules/governance/domain/entities';

export class GetActiveProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(companyId: string): Promise<Profile | null> {
    return this.profileRepository.getActiveProfile(companyId);
  }
}
