import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ErrorState, LoadingView } from '@/components/ui/state-view';
import { colors } from '@/lib/design/tokens';
import { roleHomeHref } from '@/lib/navigation';
import { useProfile } from '@/lib/profile';

export default function AppGateScreen() {
  const profileQuery = useProfile();

  useEffect(() => {
    if (!profileQuery.data) return;
    router.replace(roleHomeHref(profileQuery.data));
  }, [profileQuery.data]);

  if (profileQuery.isError) {
    return (
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: colors.canvas }} testID="app-gate-error-screen">
        <ErrorState message={profileQuery.error.message} onRetry={() => void profileQuery.refetch()} />
      </View>
    );
  }

  return <LoadingView label="Opening your Rennova workspace…" testID="app-gate-loading" />;
}
