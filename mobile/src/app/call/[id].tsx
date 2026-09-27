import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Avatar, Button, EmptyState } from '@/components/ui';
import { formatPrice } from '@/data/rules';
import { useStore } from '@/data/store';
import type { CallRequestStatus } from '@/data/types';
import { colors, GUTTER, radius, type } from '@/theme';

/** "ABC Renovations would like to discuss your project." Approve / Message instead / Decline. */
export default function CallRequestSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, contractor, project: getProject } = useStore();
  const request = state.callRequests.find((r) => r.id === id);
  const c = request ? contractor(request.contractorId) : undefined;
  const project = request ? getProject(request.projectId) : undefined;

  if (!request || !c || !project || request.status !== 'pending') {
    return <EmptyState icon="call-outline" title="Nothing to review" body="This call request has already been answered." />;
  }

  const quote = state.quotes.find((q) => q.projectId === project.id && q.contractorId === c.id);

  const respond = (status: CallRequestStatus) => {
    dispatch({ type: 'respondCall', id: request.id, status });
    router.back();
    if (status === 'message_instead') {
      router.push({ pathname: '/chat/[projectId]/[contractorId]', params: { projectId: project.id, contractorId: c.id } });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingHorizontal: GUTTER, paddingTop: 28, gap: 18 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View>
          <Avatar initials={c.initials} color={c.logoColor} size={72} />
          <View style={{ position: 'absolute', right: -6, bottom: -6, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.verified, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' }}>
            <Ionicons name="call" size={14} color="#fff" />
          </View>
        </View>
        <Text style={[type.heading, { textAlign: 'center' }]}>{c.name} would like to discuss your project</Text>
        <Text style={[type.meta, { textAlign: 'center' }]}>
          {project.title}
          {quote ? ` · Quote ${formatPrice(quote.price)}` : ''}
        </Text>
      </View>
      <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: 14 }}>
        <Text style={[type.body, { color: colors.ink }]}>“{request.note}”</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button label="Approve call" onPress={() => respond('approved')} />
        <Button label="Message instead" variant="secondary" onPress={() => respond('message_instead')} />
        <Button label="Decline" variant="ghost" onPress={() => respond('declined')} />
      </View>
      <Text style={[type.meta, { textAlign: 'center' }]}>If you approve, they can call you about this project only.</Text>
    </View>
  );
}
