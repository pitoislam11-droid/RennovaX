import { Tabs } from 'expo-router';
import { BriefcaseBusiness, Images, LayoutGrid, MessageCircle, MoreHorizontal } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, typefaces } from '@/lib/design/tokens';

function TabIcon({ icon: Icon, color, focused }: { icon: LucideIcon; color: string; focused: boolean }) {
  return <Icon color={color} fill={focused ? colors.yellow : 'transparent'} size={22} strokeWidth={focused ? 2.4 : 2} />;
}

export default function ContractorTabsLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Jobs', tabBarButtonTestID: 'contractor-jobs-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={LayoutGrid} /> }} />
      <Tabs.Screen name="quotes" options={{ title: 'Quotes', tabBarButtonTestID: 'contractor-quotes-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={BriefcaseBusiness} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarButtonTestID: 'contractor-messages-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={MessageCircle} /> }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio', tabBarButtonTestID: 'contractor-portfolio-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={Images} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarButtonTestID: 'contractor-more-tab', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} icon={MoreHorizontal} /> }} />
      {/* Ask remains reachable from Jobs header + opportunity briefs */}
      <Tabs.Screen name="ask" options={{ href: null, title: 'Ask' }} />
    </Tabs>
  );
}
