import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Photo, Row } from '@/components/ui';
import { MEDIA } from '@/data/media';
import { useStore } from '@/data/store';
import type { Role } from '@/data/types';
import { colors, GUTTER, type } from '@/theme';

const SLIDES = [
  {
    title: 'Your home project, made easy.',
    body: 'Create a project, receive quotes from trusted contractors, and find the right person for the job.',
    image: MEDIA.onboardingHero,
  },
  {
    title: 'Compare quotes side by side.',
    body: 'Price, reviews, warranty and what’s included, all in one place. Quotes are private, so contractors can’t undercut each other.',
    image: MEDIA.kitchen,
  },
  {
    title: 'You stay in control.',
    body: 'Your number stays private. Contractors can only call if you approve, and every review comes from a real completed job.',
    image: MEDIA.livingRoom3,
  },
];

const HERO_HEIGHT = Math.round(Dimensions.get('window').height * 0.4);

export default function Onboarding() {
  const { dispatch } = useStore();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const finish = (role: Role) => {
    dispatch({ type: 'setRole', role });
    dispatch({ type: 'onboard' });
    router.replace('/(tabs)');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: GUTTER, height: 36 }}>
        <Pressable onPress={() => finish('homeowner')} hitSlop={10} accessibilityRole="button">
          <Text style={[type.metaStrong, { color: colors.ink3 }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ flex: 1 }}>
        {SLIDES.map((s) => (
          <View key={s.title} style={{ width, paddingHorizontal: GUTTER, gap: 14 }}>
            <Text style={type.hero}>{s.title}</Text>
            <Text style={[type.body, { fontSize: 16, lineHeight: 23 }]}>{s.body}</Text>
            <Photo
              uri={s.image}
              style={{ height: HERO_HEIGHT, marginTop: 12, borderTopLeftRadius: 200, borderTopRightRadius: 200, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
            />
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: GUTTER, paddingBottom: 12, gap: 14 }}>
        <Row gap={6} style={{ justifyContent: 'center', paddingVertical: 6 }}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={{ width: i === page ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === page ? colors.ink : '#D5D5D1' }} />
          ))}
        </Row>
        <Button label="Get started" onPress={() => finish('homeowner')} />
        <Text style={[type.meta, { textAlign: 'center' }]}>
          Already have an account?{' '}
          <Text style={type.metaStrong} onPress={() => finish('homeowner')}>Sign in</Text>
        </Text>
        <Text style={[type.meta, { textAlign: 'center' }]}>
          Are you a contractor?{' '}
          <Text style={[type.metaStrong, { color: colors.verified }]} onPress={() => finish('contractor')}>Join free</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
