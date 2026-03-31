import type { ProfileRepository } from '@/modules/governance/domain/contracts';
import type { CreateProfileInput } from '@/modules/governance/domain/types';

export class CreateProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: CreateProfileInput) {
    return this.profileRepository.createProfile(input);
  }
}
