import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { EmptyState, Header, Screen } from '@/components/ui';
import { PRIVACY, TERMS } from '@/content/legal';
import { GUTTER, space, type } from '@/theme';

export default function LegalDocument() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = doc === 'privacy' ? PRIVACY : doc === 'terms' ? TERMS : null;

  if (!content) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="document-text-outline" title="Page not found" body="" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={content.title} />
      <View style={{ paddingHorizontal: GUTTER, gap: space.xl }}>
        <Text style={type.meta}>Last updated {content.updated}</Text>
        {content.sections.map((s) => (
          <View key={s.heading} style={{ gap: 6 }}>
            <Text style={type.subheading}>{s.heading}</Text>
            <Text style={type.body}>{s.body}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
