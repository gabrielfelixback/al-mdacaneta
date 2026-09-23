import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'label' | 'small' | 'caption' | 'number';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  /** Instrument Serif itálico — usar só na palavra-chave da frase. */
  italic?: boolean;
  align?: TextStyle['textAlign'];
}

export function Txt({ variant = 'body', color, italic, align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        styles[variant],
        italic && { fontFamily: fonts.serifItalic },
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 48, color: colors.text, letterSpacing: -0.5 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: colors.text, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, color: colors.text },
  h3: { fontFamily: fonts.sansSemi, fontSize: 17, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: colors.text },
  bodyStrong: { fontFamily: fonts.sansSemi, fontSize: 15, lineHeight: 21, color: colors.text },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  caption: { fontFamily: fonts.sans, fontSize: 11, lineHeight: 14, color: colors.textMuted },
  number: { fontFamily: fonts.sansSemi, fontSize: 30, lineHeight: 34, color: colors.text, letterSpacing: -0.5 },
});
