import { Redirect } from 'expo-router';

import { useStore } from '@/data/store';

export default function Entry() {
  const { state } = useStore();
  return <Redirect href={state.session.onboarded ? '/(tabs)' : '/onboarding'} />;
}
