export const colors = {
  background: '#F7FAF3',
  backgroundAlt: '#EEF7E8',
  surface: '#FFFFFF',
  surfaceSoft: '#FBFDF8',
  text: '#172116',
  muted: '#6E766D',
  primary: '#398B21',
  primaryDark: '#276E14',
  primaryLight: '#62B246',
  primarySoft: '#E8F5DC',
  lime: '#D9F2B8',
  line: '#E7EDE4',
  orange: '#F4931E',
  blue: '#3679D6',
  red: '#DD6255',
  shadow: '#20371B'
} as const;

export const radius = { sm: 12, md: 18, lg: 24, xl: 30, pill: 999 } as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  button: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  }
} as const;
