import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { colors, palette } from '@/theme/tokens';
import { Txt } from './Txt';

// Comprimento aproximado do traço curvo no viewBox (reta de 22 + curva de ~40).
const CURVE_LEN = 62;
const CURVE = 'M28 24 H50 C62 24 72 18 84 6';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface MarkProps {
  size?: number;
  color?: string;
  accent?: string;
  /** 0..1 — quanto da linha curva aparece (usado como indicador de progresso). */
  progress?: number;
  /** Desenha a linha argila ao montar. */
  animate?: boolean;
}

/** Símbolo da marca: a cápsula com a linha curva em argila. */
export function CapsuleMark({ size = 40, color = colors.text, accent = palette.argila, progress = 1, animate }: MarkProps) {
  const target = Math.max(0, Math.min(1, progress));
  const [anim] = useState(() => new Animated.Value(animate ? 0 : target));
  const dashOffset = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [CURVE_LEN, 0] }), [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: animate ? 1100 : 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, target, animate]);

  const sw = Math.max(1.5, size * 0.07) * (40 / size);
  return (
    <Svg width={size * 2.2} height={size} viewBox="0 0 88 40">
      <Rect x={2} y={17} width={26} height={14} rx={7} stroke={color} strokeWidth={sw} fill="none" />
      <Line x1={15} y1={17} x2={15} y2={31} stroke={color} strokeWidth={sw} />
      {Platform.OS === 'web' ? (
        <Path
          d={CURVE}
          stroke={accent}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CURVE_LEN}
          strokeDashoffset={CURVE_LEN * (1 - target)}
        />
      ) : (
      <AnimatedPath
        d={CURVE}
        stroke={accent}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={CURVE_LEN}
        strokeDashoffset={dashOffset}
      />
      )}
    </Svg>
  );
}

/** Ícone da cápsula no formato dos ícones de traço (usado na aba Doses). */
export function CapsuleIcon({ size = 24, color = colors.text, strokeWidth = 1.8 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2.5} y={8} width={19} height={8} rx={4} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <Line x1={12} y1={8} x2={12} y2={16} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function Wordmark({ color = colors.text, size = 22, markColor }: { color?: string; size?: number; markColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <CapsuleMark size={size * 0.9} color={markColor ?? color} />
      <Txt style={{ fontSize: size, lineHeight: size * 1.15 }} variant="h2" color={color}>
        <Txt italic style={{ fontSize: size, lineHeight: size * 1.15 }} color={color}>
          além
        </Txt>{' '}
        da caneta
      </Txt>
    </View>
  );
}

const COVER_TONES = {
  floresta: { bg: palette.floresta, fg: palette.creme, sub: '#A9B8AC' },
  linho: { bg: palette.linho, fg: palette.floresta, sub: palette.musgo },
  salvia: { bg: palette.salvia, fg: palette.floresta, sub: palette.musgo },
  argila: { bg: palette.argila, fg: palette.creme, sub: '#F1DCCD' },
} as const;

/** Capa de material do curso, no estilo da página de vendas. */
export function BookCover({
  title,
  italic,
  tone,
  tag,
  style,
  small,
}: {
  title: string;
  italic: string;
  tone: keyof typeof COVER_TONES;
  tag: string;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const t = COVER_TONES[tone];
  const fs = small ? 22 : 30;
  return (
    <View
      style={[
        { backgroundColor: t.bg, borderRadius: 14, padding: small ? 12 : 16, aspectRatio: 0.72, justifyContent: 'space-between', overflow: 'hidden' },
        style,
      ]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CapsuleMark size={small ? 11 : 14} color={t.fg} accent={tone === 'argila' ? palette.creme : palette.argila} />
        <Txt variant="label" color={t.sub} style={{ fontSize: 9, letterSpacing: 1.2 }}>
          {tag}
        </Txt>
      </View>
      <View>
        <Txt variant="h2" color={t.fg} style={{ fontSize: fs, lineHeight: fs * 1.05 }}>
          {title}
        </Txt>
        <Txt variant="h2" italic color={t.fg} style={{ fontSize: fs, lineHeight: fs * 1.05 }}>
          {italic}
        </Txt>
      </View>
      <View style={{ height: 1.5, width: '40%', backgroundColor: tone === 'argila' ? palette.creme : palette.argila, borderRadius: 1 }} />
    </View>
  );
}
