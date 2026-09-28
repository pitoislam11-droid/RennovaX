import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

const LIQUID = isLiquidGlassAvailable();

type GlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  /** 'clear' floats over photos; 'regular' reads well over content. */
  variant?: 'regular' | 'clear';
};

/**
 * Apple Liquid Glass on iOS 26+, a frosted blur on older iOS, and a translucent surface on
 * Android and web.
 */
export function Glass({ children, style, interactive, variant = 'regular' }: GlassProps) {
  if (LIQUID) {
    return (
      <GlassView glassEffectStyle={variant} isInteractive={interactive} colorScheme="light" style={[styles.base, style]}>
        {children}
      </GlassView>
    );
  }
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={60} tint="systemChromeMaterialLight" style={[styles.base, styles.fallbackEdge, style]}>
        {children}
      </BlurView>
    );
  }
  return <View style={[styles.base, styles.fallbackEdge, styles.android, style]}>{children}</View>;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Round glass button, used for back/share/more over photos and in headers. */
export function GlassIconButton({
  icon,
  onPress,
  label,
  size = 44,
  variant = 'regular',
  color = colors.ink,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  size?: number;
  variant?: 'regular' | 'clear';
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}>
      <Glass interactive variant={variant} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={size * 0.45} color={color} />
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fallbackEdge: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.7)' },
  android: { backgroundColor: 'rgba(255,255,255,0.88)' },
});
