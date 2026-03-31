import type { ProfileRepository } from '@/modules/governance/domain/contracts';
import type { CreateSnapshotInput } from '@/modules/governance/domain/types';

export class CreateSnapshotUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: CreateSnapshotInput) {
    return this.profileRepository.createSnapshot(input);
  }
}
