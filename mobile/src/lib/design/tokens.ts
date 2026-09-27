import { Platform, type TextStyle } from 'react-native';

export const colors = {
  canvas: '#F7F4EC',
  paper: '#FFFDF8',
  ink: '#1D1D1B',
  muted: '#6F6C63',
  line: '#DDD8CC',
  yellow: '#FFD21C',
  yellowSoft: '#FFF2A8',
  red: '#D84B3E',
  green: '#2F6956',
  darkGreen: '#173B31',
} as const;

export const typefaces = {
  regular: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'system-ui' }),
  medium: Platform.select({ ios: 'Avenir Next Medium', android: 'sans-serif-medium', default: 'system-ui' }),
  demi: Platform.select({ ios: 'Avenir Next Demi Bold', android: 'sans-serif-medium', default: 'system-ui' }),
  bold: Platform.select({ ios: 'Avenir Next Bold', android: 'sans-serif', default: 'system-ui' }),
} satisfies Record<string, TextStyle['fontFamily']>;

export const shadows = {
  soft: {
    shadowColor: '#191815',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  floating: {
    shadowColor: '#191815',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 7,
  },
} as const;
