import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { GlassIconButton } from '@/components/Glass';
import { Row, Screen } from '@/components/ui';
import { CATEGORIES } from '@/data/categories';
import { colors, GUTTER, radius, shadow, space, type } from '@/theme';

export default function ChooseCategory() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = q
    ? CATEGORIES.filter((c) => `${c.name} ${c.blurb}`.toLowerCase().includes(q))
    : CATEGORIES;

  return (
    <Screen contentStyle={{ paddingTop: 16 }}>
      <Row style={{ paddingHorizontal: GUTTER, justifyContent: 'space-between' }}>
        <Text style={[type.meta, { fontWeight: '600' }]}>Step 1 · Choose a service</Text>
        <GlassIconButton icon="close" label="Close" onPress={() => router.back()} />
      </Row>
      <Text style={[type.title, { paddingHorizontal: GUTTER, marginTop: space.md }]}>What kind of work do you need?</Text>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.lg }}>
        <Row gap={10} style={{ backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: colors.line }}>
          <Ionicons name="search" size={18} color={colors.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search, e.g. rewire, patio, loft"
            placeholderTextColor={colors.ink3}
            style={{ flex: 1, fontSize: 16, color: colors.ink }}
            accessibilityLabel="Search services"
          />
        </Row>
      </View>

      <View style={{ paddingHorizontal: GUTTER, marginTop: space.lg, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {list.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={c.name}
            onPress={() => router.push({ pathname: '/new/[category]', params: { category: c.id } })}
            style={({ pressed }) => [
              { width: '48.4%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 14, minHeight: 128, ...shadow },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.tint.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={c.icon} size={22} color={c.tint.fg} />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={type.bodyStrong}>{c.name}</Text>
              <Text style={type.meta}>{c.blurb}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
