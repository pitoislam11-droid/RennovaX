import { Redirect } from 'expo-router';

import { useStore } from '@/data/store';

export default function Entry() {
  const { state, live, account } = useStore();
  if (!state.session.onboarded) return <Redirect href="/onboarding" />;
  if (live && !account) return <Redirect href="/sign-in" />;
  if (live && account && !account.profileComplete) return <Redirect href="/complete-profile" />;
  return <Redirect href="/(tabs)" />;
}
