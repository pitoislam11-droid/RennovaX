import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/Glass';
import { Badge, Button, Card, EmptyState, Header, KeyValue, Photo, Row, Screen, Section } from '@/components/ui';
import { useStore } from '@/data/store';
import { GUTTER, space, type } from '@/theme';

/** Drag the handle to reveal before vs after. */
function BeforeAfter({ before, after, height }: { before: string; after: string; height: number }) {
  const [width, setWidth] = useState(0);
  const [split, setSplit] = useState(0.5);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      if (width > 0) setSplit(Math.min(0.95, Math.max(0.05, e.x / width)));
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ height }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel="Before and after comparison" accessibilityHint="Drag to compare">
        <Photo uri={after} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: width * split, overflow: 'hidden' }}>
          <Photo uri={before} style={{ width, height }} />
        </View>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: width * split - 1, width: 2, backgroundColor: '#fff' }} />
        <View style={{ position: 'absolute', top: height / 2 - 22, left: width * split - 22 }} pointerEvents="none">
          <GlassIconButton icon="swap-horizontal" label="Drag to compare" />
        </View>
        <View style={{ position: 'absolute', bottom: 16, left: 16 }}><Badge label="Before" tone="dark" /></View>
        <View style={{ position: 'absolute', bottom: 16, right: 16 }}><Badge label="After" tone="dark" /></View>
      </View>
    </GestureDetector>
  );
}

export default function PortfolioItem() {
  const { contractorId, itemId } = useLocalSearchParams<{ contractorId: string; itemId: string }>();
  const { contractor, state } = useStore();
  const insets = useSafeAreaInsets();
  const c = contractor(contractorId);
  const item = c?.portfolio.find((p) => p.id === itemId);

  if (!c || !item) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="images-outline" title="Project not found" body="This portfolio item is no longer available." />
      </Screen>
    );
  }

  return (
    <Screen
        contentStyle={{ paddingTop: 0 }}
        footer={state.session.role === 'homeowner' ? <Button label={`Invite ${c.name} to quote`} onPress={() => router.push(`/contractor/${c.id}`)} /> : undefined}>
        <View>
          <BeforeAfter before={item.before} after={item.after} height={420} />
          <View style={{ position: 'absolute', top: insets.top + 8, left: GUTTER }}>
            <GlassIconButton icon="chevron-back" label="Back" variant="clear" onPress={() => router.back()} />
          </View>
        </View>

        <View style={{ paddingHorizontal: GUTTER, marginTop: space.xl, gap: 8 }}>
          <Badge label="Verified Rennova project" tone="green" icon="shield-checkmark" />
          <Text style={type.title}>{item.title}</Text>
          <Text style={type.meta}>{item.area} · {item.year} · by {c.name}</Text>
          <Text style={[type.body, { marginTop: 6 }]}>{item.description}</Text>
        </View>

        <Section>
          <Card style={{ paddingVertical: 4 }}>
            <KeyValue label="Duration" value={`${item.durationDays} working days`} />
            <KeyValue label="Location" value={item.area} />
            <KeyValue label="Completed" value={String(item.year)} last />
          </Card>
        </Section>

        {item.gallery.length > 0 ? (
          <Section title="More photos">
            <Row gap={10}>
              {item.gallery.map((uri, i) => (
                <Photo key={`${uri}-${i}`} uri={uri} style={{ flex: 1, height: 150, borderRadius: 16 }} />
              ))}
            </Row>
          </Section>
        ) : null}
    </Screen>
  );
}
