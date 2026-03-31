import type { Profile } from '../entities/Profile';
import type { ProfileSnapshot } from '../entities/ProfileSnapshot';
import type { CreateProfileInput, CreateSnapshotInput } from '../types/ProfileTypes';

export interface ProfileRepository {
  getActiveProfile(companyId: string): Promise<Profile | null>;
  createProfile(input: CreateProfileInput): Promise<Profile>;
  approveProfile(profileId: string, approvedBy: string): Promise<Profile | null>;
  createSnapshot(input: CreateSnapshotInput): Promise<ProfileSnapshot>;
}
