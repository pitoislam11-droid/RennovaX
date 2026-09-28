import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { colors } from '@/theme';

import { Glass } from './Glass';
import type { IconName } from './ui';

type TabConfig = { label: string; icon: IconName; activeIcon: IconName };

const HOMEOWNER: Record<string, TabConfig> = {
  index: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  projects: { label: 'Projects', icon: 'document-text-outline', activeIcon: 'document-text' },
  post: { label: 'Post', icon: 'add', activeIcon: 'add' },
  messages: { label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  profile: { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
};

const CONTRACTOR: Record<string, TabConfig> = {
  index: { label: 'Jobs', icon: 'search-outline', activeIcon: 'search' },
  projects: { label: 'My work', icon: 'briefcase-outline', activeIcon: 'briefcase' },
  messages: { label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  profile: { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
};

/** Floating Liquid Glass tab bar with a raised "Post a project" button for homeowners. */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { state: app } = useStore();
  const config = app.session.role === 'homeowner' ? HOMEOWNER : CONTRACTOR;
  const unread = app.callRequests.filter((r) => r.status === 'pending').length;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Glass style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = config[route.name];
          if (!tab) return null;
          const focused = state.index === index;

          if (route.name === 'post') {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel="Post a project"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
                  router.push('/new');
                }}
                style={styles.item}>
                <View style={styles.post}>
                  <Ionicons name="add" size={26} color="#fff" />
                </View>
                <Text style={styles.label}>{tab.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  Haptics.selectionAsync().catch(() => undefined);
                  navigation.navigate(route.name);
                }
              }}
              style={styles.item}>
              <View>
                <Ionicons name={focused ? tab.activeIcon : tab.icon} size={23} color={focused ? colors.ink : colors.ink3} />
                {route.name === 'messages' && unread > 0 && app.session.role === 'homeowner' ? <View style={styles.dot} /> : null}
              </View>
              <Text style={[styles.label, focused && { color: colors.ink, fontWeight: '700' }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 34,
    height: 72,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' },
  label: { fontSize: 11, fontWeight: '600', color: colors.ink3 },
  post: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  dot: { position: 'absolute', top: -1, right: -3, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: '#fff' },
});
