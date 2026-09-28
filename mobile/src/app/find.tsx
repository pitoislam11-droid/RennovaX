import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { ContractorCard } from '@/components/marketplace';
import { Card, Chip, EmptyState, Header, Row, Screen } from '@/components/ui';
import { CATEGORIES } from '@/data/categories';
import { useStore } from '@/data/store';
import type { CategoryId } from '@/data/types';
import { showAlert } from '@/lib/dialog';
import { colors, GUTTER, radius, space, type } from '@/theme';

export default function FindContractors() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const { state, project: getProject, dispatch } = useStore();
  const inviteFor = projectId ? getProject(projectId) : undefined;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>(inviteFor?.categoryId ?? 'all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.contractors
      .filter((c) => category === 'all' || c.categories.includes(category))
      .filter((c) => !verifiedOnly || c.verifiedBusiness)
      .filter((c) => !q || `${c.name} ${c.services.join(' ')} ${c.areas.join(' ')} ${c.baseArea}`.toLowerCase().includes(q));
  }, [state.contractors, query, category, verifiedOnly]);

  return (
    <Screen>
      <Header title={inviteFor ? 'Invite a contractor' : 'Find a contractor'} subtitle={inviteFor?.title} />
      <View style={{ paddingHorizontal: GUTTER }}>
        <Row gap={10} style={{ backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: colors.line }}>
          <Ionicons name="search" size={18} color={colors.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Painters in Clapham, bathroom fitters…"
            placeholderTextColor={colors.ink3}
            style={{ flex: 1, fontSize: 16, color: colors.ink }}
            accessibilityLabel="Search contractors"
          />
        </Row>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8, marginTop: space.md }}>
        <Chip label="Verified" selected={verifiedOnly} onPress={() => setVerifiedOnly((v) => !v)} />
        <Chip label="All services" selected={category === 'all'} onPress={() => setCategory('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.name} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>
      <Text style={[type.meta, { paddingHorizontal: GUTTER, marginTop: space.lg }]}>
        {results.length} contractor{results.length === 1 ? '' : 's'}
      </Text>
      <View style={{ paddingHorizontal: GUTTER, gap: 14, marginTop: space.md }}>
        {results.length === 0 ? (
          <Card>
            <EmptyState icon="search-outline" title="No matches" body="Try another service or area." />
          </Card>
        ) : (
          results.map((c) => (
            <ContractorCard
              key={c.id}
              contractor={c}
              onInvite={
                inviteFor
                  ? () => {
                      dispatch({ type: 'inviteContractor', projectId: inviteFor.id, contractorId: c.id });
                      showAlert('Invitation sent', `${c.name} has been invited to quote for ${inviteFor.title}.`);
                    }
                  : undefined
              }
            />
          ))
        )}
      </View>
    </Screen>
  );
}
