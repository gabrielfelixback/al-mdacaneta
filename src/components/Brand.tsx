import { View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { colors, palette } from '@/theme/tokens';
import { Txt } from './Txt';

interface MarkProps {
  size?: number;
  color?: string;
  accent?: string;
  /** 0..1 — quanto da linha curva aparece (usado como indicador de progresso). */
  progress?: number;
}

/** Símbolo da marca: a cápsula com a linha curva em argila. */
export function CapsuleMark({ size = 40, color = colors.text, accent = palette.argila, progress = 1 }: MarkProps) {
  const w = size * 2.2;
  const h = size;
  const stroke = Math.max(1.5, size * 0.07);
  // Comprimento aproximado do traço curvo no viewBox (reta de 22 + curva de ~40).
  const pathLen = 62;
  return (
    <Svg width={w} height={h} viewBox="0 0 88 40">
      <Rect x={2} y={17} width={26} height={14} rx={7} stroke={color} strokeWidth={stroke * (40 / size)} fill="none" />
      <Line x1={15} y1={17} x2={15} y2={31} stroke={color} strokeWidth={stroke * (40 / size)} />
      <Path
        d="M28 24 H50 C62 24 72 18 84 6"
        stroke={accent}
        strokeWidth={stroke * (40 / size)}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={pathLen}
        strokeDashoffset={pathLen * (1 - Math.max(0, Math.min(1, progress)))}
      />
    </Svg>
  );
}

export function Wordmark({ color = colors.text, size = 22 }: { color?: string; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <CapsuleMark size={size * 0.9} color={color} />
      <Txt style={{ fontSize: size, lineHeight: size * 1.15 }} variant="h2" color={color}>
        <Txt italic style={{ fontSize: size, lineHeight: size * 1.15 }} color={color}>
          além
        </Txt>{' '}
        da caneta
      </Txt>
    </View>
  );
}
