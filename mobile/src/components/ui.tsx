import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Category } from '@/data/categories';
import { IMAGE_FALLBACK } from '@/data/media';
import { colors, GUTTER, radius, shadow, space, TAB_BAR_SPACE, type } from '@/theme';

import { GlassIconButton } from './Glass';

export type IconName = ComponentProps<typeof Ionicons>['name'];

const tap = () => Haptics.selectionAsync().catch(() => undefined);

/* ---------- layout ---------- */

export function Screen({
  children,
  tabs = false,
  footer,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  tabs?: boolean;
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const bottom = tabs ? TAB_BAR_SPACE : footer ? 24 : insets.bottom + 24;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[{ paddingTop: insets.top + 8, paddingBottom: bottom }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop: insets.top + 8 }, contentStyle]}>{children}</View>
      )}
      {footer ? <Footer>{footer}</Footer> : null}
    </View>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.footer}>
      <View style={{ gap: space.sm }}>{children}</View>
    </SafeAreaView>
  );
}

export function Header({
  title,
  onBack,
  right,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
  onBack?: (() => void) | false;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ width: 44 }}>
        {onBack !== false && (
          <GlassIconButton icon="chevron-back" label="Back" onPress={onBack ?? (() => router.back())} />
        )}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {title ? <Text style={type.subheading} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={type.meta}>{subtitle}</Text> : null}
      </View>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
  style,
}: {
  title?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ paddingHorizontal: GUTTER, marginTop: 28, gap: space.md }, style]}>
      {title ? (
        <View style={styles.rowBetween}>
          <Text style={type.subheading}>{title}</Text>
          {action ? (
            <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
              <Text style={[type.metaStrong, { color: colors.ink3 }]}>{action}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
}) {
  const body = <View style={[styles.card, padded && { padding: space.lg }, style]}>{children}</View>;
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      {body}
    </Pressable>
  );
}

export function Row({ children, gap = space.md, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />;
}

/* ---------- buttons ---------- */

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  small,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'green';
  icon?: IconName;
  small?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = { primary: colors.black, secondary: colors.surface, ghost: 'transparent', green: colors.verified }[variant];
  const fg = variant === 'primary' || variant === 'green' ? '#fff' : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.85 : 1 },
        variant === 'secondary' && styles.buttonOutline,
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: small ? 14 : 16, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function RoundButton({ icon, onPress, label, size = 44 }: { icon: IconName; onPress?: () => void; label: string; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.black,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}>
      <Ionicons name={icon} size={size * 0.45} color="#fff" />
    </Pressable>
  );
}

/* ---------- content ---------- */

export function Photo({ uri, style, children }: { uri: string; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: IMAGE_FALLBACK }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      {children}
    </View>
  );
}

export function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36, letterSpacing: 0.3 }}>{initials}</Text>
    </View>
  );
}

export function Rating({ value, count, style }: { value: number; count?: number; style?: StyleProp<TextStyle> }) {
  return (
    <Row gap={4}>
      <Ionicons name="star" size={13} color={colors.star} />
      <Text style={[type.metaStrong, style]}>{value.toFixed(1)}</Text>
      {count !== undefined ? <Text style={type.meta}>({count} reviews)</Text> : null}
    </Row>
  );
}

export function VerifiedTick({ size = 18 }: { size?: number }) {
  return <Ionicons name="checkmark-circle" size={size} color={colors.verified} accessibilityLabel="Verified" />;
}

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'green' | 'dark' | 'blue'; icon?: IconName }) {
  const palette = {
    neutral: { bg: colors.sunk, fg: colors.ink2 },
    green: { bg: colors.verifiedTint, fg: colors.verified },
    dark: { bg: colors.black, fg: '#fff' },
    blue: { bg: '#E7F0FF', fg: colors.blue },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette.fg} /> : null}
      <Text style={{ fontSize: 12, fontWeight: '700', color: palette.fg }}>{label}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, selected && { backgroundColor: colors.black, borderColor: colors.black }]}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: selected ? '#fff' : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segment, on && styles.segmentOn]}>
            <Text style={{ fontSize: 14, fontWeight: on ? '700' : '600', color: on ? '#fff' : colors.ink3 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CategoryTile({ category, onPress }: { category: Category; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [{ alignItems: 'center', gap: 8, flex: 1, opacity: pressed ? 0.7 : 1 }]}>
      <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: category.tint.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={category.icon} size={26} color={category.tint.fg} />
      </View>
      <Text style={{ fontSize: 11.5, lineHeight: 14, fontWeight: '600', color: colors.ink2, textAlign: 'center' }} numberOfLines={2}>
        {category.shortName}
      </Text>
    </Pressable>
  );
}

export function OptionRow({
  label,
  selected,
  multi,
  onPress,
  sublabel,
}: {
  label: string;
  selected: boolean;
  multi?: boolean;
  onPress: () => void;
  sublabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.option, selected && styles.optionOn]}>
      <View
        style={[
          multi ? styles.check : styles.radio,
          selected && (multi ? { backgroundColor: colors.black, borderColor: colors.black } : { borderWidth: 7, borderColor: colors.black }),
        ]}>
        {multi && selected ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.bodyStrong, { fontWeight: '500' }]}>{label}</Text>
        {sublabel ? <Text style={type.meta}>{sublabel}</Text> : null}
      </View>
    </Pressable>
  );
}

export function KeyValue({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.kv, last && { borderBottomWidth: 0 }]}>
      <Text style={[type.body, { color: colors.ink3 }]}>{label}</Text>
      <Text style={[type.bodyStrong, { flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

export function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Row gap={6} style={{ flex: 1 }}>
      <Ionicons name={icon} size={16} color={colors.ink3} />
      <View style={{ flexShrink: 1 }}>
        <Text style={[type.metaStrong, { fontSize: 12 }]} numberOfLines={1}>{value}</Text>
        <Text style={type.caption}>{label}</Text>
      </View>
    </Row>
  );
}

export function Notice({ icon = 'lock-closed-outline', children }: { icon?: IconName; children: ReactNode }) {
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={18} color={colors.verified} />
      <Text style={[type.meta, { color: colors.ink2, flex: 1 }]}>{children}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sunk, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={28} color={colors.ink3} />
      </View>
      <Text style={[type.subheading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.body, { textAlign: 'center' }]}>{body}</Text>
      {action}
    </View>
  );
}

export function Stars({ value, onChange, size = 28 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <Row gap={4}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          disabled={!onChange}
          accessibilityRole="button"
          accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
          hitSlop={4}
          onPress={() => {
            tap();
            onChange?.(n);
          }}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? colors.star : '#CFCFCB'} />
        </Pressable>
      ))}
    </Row>
  );
}

export const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER, paddingBottom: space.md, gap: space.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: GUTTER,
    paddingTop: space.md,
    paddingBottom: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  button: {
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSmall: { height: 42, paddingHorizontal: 16 },
  buttonOutline: { borderWidth: 1, borderColor: colors.line },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, justifyContent: 'center' },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, gap: 4, borderWidth: 1, borderColor: colors.line },
  segment: { flex: 1, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.black },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  optionOn: { borderWidth: 2, borderColor: colors.black, padding: space.lg - 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#B7B7B2' },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: '#B7B7B2', alignItems: 'center', justifyContent: 'center' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: radius.md, backgroundColor: colors.sunk },
});
