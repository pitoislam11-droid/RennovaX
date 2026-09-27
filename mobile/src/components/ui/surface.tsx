import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { colors, shadows } from '@/lib/design/tokens';

export function PaperSurface({
  children,
  className,
  style,
  elevated = true,
  testID,
}: {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
  elevated?: boolean;
  testID?: string;
}) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: colors.paper,
          borderRadius: 26,
          ...(elevated ? shadows.soft : { borderColor: '#E3DED2', borderWidth: 1 }),
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
