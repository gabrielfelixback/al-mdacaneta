// Tokens do guia de marca "Além da Caneta" v1 (set/2026).
// Paleta 60/30/10: Creme/Linho como base, Floresta/Sálvia/Musgo como apoio, Argila só como acento.

export const palette = {
  floresta: '#17332B',
  creme: '#F4F0E8',
  linho: '#E4DDCF',
  salvia: '#B7C4B1',
  musgo: '#4A5E52',
  argila: '#B8744F',
  branco: '#FFFDF9',
} as const;

export const colors = {
  bg: palette.creme,
  bgAlt: palette.linho,
  card: palette.branco,
  cardStrong: palette.floresta,
  text: palette.floresta,
  textSecondary: palette.musgo,
  textMuted: '#7D8A80',
  textOnStrong: palette.creme,
  textOnStrongMuted: '#A9B8AC',
  accent: palette.argila,
  support: palette.salvia,
  line: '#DCD4C4',
  lineSoft: '#ECE6DA',
  track: '#E9E3D6',
  trackOnStrong: 'rgba(244,240,232,0.14)',
  danger: '#A4442C',
  // Faixas de IMC em tons dessaturados, coerentes com a paleta.
  bmiUnder: '#8FA3AE',
  bmiHealthy: '#6F8F74',
  bmiOver: '#C9975F',
  bmiObese: '#A4552F',
  // Macros
  protein: palette.argila,
  carbs: '#C9A66B',
  fat: '#8FA3AE',
  fiber: palette.musgo,
  water: '#7D9CA8',
} as const;

export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'InstrumentSans_400Regular',
  sansMedium: 'InstrumentSans_500Medium',
  sansSemi: 'InstrumentSans_600SemiBold',
  sansBold: 'InstrumentSans_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const MAX_WIDTH = 560;
