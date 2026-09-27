import type { Profile } from '@/lib/contracts';

export function homeownerHomeHref() {
  return '/(app)/(tabs)' as const;
}

export function contractorHomeHref(profile: Pick<Profile, 'contractorProfile'>) {
  if (!profile.contractorProfile) return '/(app)/contractor-setup' as const;
  return '/(app)/(contractor-tabs)' as const;
}

export function roleHomeHref(profile: Profile) {
  if (profile.roles.length === 0) return '/(app)/role-select' as const;
  if (profile.activeRole === 'CONTRACTOR') return contractorHomeHref(profile);
  return homeownerHomeHref();
}
