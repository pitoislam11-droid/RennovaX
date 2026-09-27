import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  bg: '#F6F6F4',
  surface: '#FFFFFF',
  sunk: '#F0F0EE',
  ink: '#0E0F12',
  ink2: '#3E424A',
  ink3: '#6B7078',
  line: '#E7E7E4',
  black: '#111214',
  verified: '#1E9E57',
  verifiedTint: '#E5F6EC',
  star: '#F5A524',
  blue: '#2F6BFF',
  danger: '#C8372D',
};

export const radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

/** Horizontal page gutter. */
export const GUTTER = 20;
/** Space reserved at the bottom of tab screens for the floating glass tab bar. */
export const TAB_BAR_SPACE = 120;

export const shadow: ViewStyle = Platform.select<ViewStyle>({
  ios: { shadowColor: '#0E0F12', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  default: { elevation: 3 },
})!;

export const shadowSoft: ViewStyle = Platform.select<ViewStyle>({
  ios: { shadowColor: '#0E0F12', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  default: { elevation: 1 },
})!;

export const type = {
  hero: { fontSize: 38, lineHeight: 42, fontWeight: '800', letterSpacing: -1.2, color: colors.ink },
  title: { fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.8, color: colors.ink },
  heading: { fontSize: 20, lineHeight: 25, fontWeight: '700', letterSpacing: -0.4, color: colors.ink },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2, color: colors.ink },
  body: { fontSize: 15, lineHeight: 21, color: colors.ink2 },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, lineHeight: 17, color: colors.ink3 },
  metaStrong: { fontSize: 13, lineHeight: 17, fontWeight: '600', color: colors.ink },
  caption: { fontSize: 11, lineHeight: 14, color: colors.ink3 },
  price: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: colors.ink },
} satisfies Record<string, TextStyle>;
