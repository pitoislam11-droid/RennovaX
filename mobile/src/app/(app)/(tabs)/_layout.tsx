import { Tabs } from 'expo-router';
import { Hammer, Home, MessageCircle, MoreHorizontal, NotebookTabs } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, typefaces } from '@/lib/design/tokens';

function TabIcon({ icon: Icon, color, focused }: { icon: LucideIcon; color: string; focused: boolean }) {
  return <Icon color={color} fill={focused ? colors.yellow : 'transparent'} size={22} strokeWidth={focused ? 2.4 : 2} />;
}

export default function HomeownerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: '#8D8A82',
        tabBarLabelStyle: { fontFamily: typefaces.medium, fontSize: 10, marginTop: 1 },
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: 'rgba(29,29,27,0.08)',
          borderTopWidth: 0.5,
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarButtonTestID: 'home-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={Home} /> }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects', tabBarButtonTestID: 'projects-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={NotebookTabs} /> }} />
      <Tabs.Screen name="contractors" options={{ title: 'Contractors', tabBarButtonTestID: 'contractors-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={Hammer} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarButtonTestID: 'messages-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={MessageCircle} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarButtonTestID: 'more-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={MoreHorizontal} /> }} />
    </Tabs>
  );
}
