import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { GlassTabBar } from '@/components/GlassTabBar';
import { useStore } from '@/data/store';

export default function TabsLayout() {
  const { live, account } = useStore();
  if (live && !account) return <Redirect href="/sign-in" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <GlassTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
