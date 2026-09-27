import { Text } from 'react-native';

import { colors, typefaces } from '@/lib/design/tokens';

/** Sentence-case field label — never uppercase kickers (DESIGN.md). */
export function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-[14px]" style={{ color: colors.muted, fontFamily: typefaces.medium }}>
      {children}
    </Text>
  );
}
