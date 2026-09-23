import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { addDays, dayKey, startOfWeek, WEEKDAYS_SHORT } from '@/lib/dates';
import { colors, fonts, palette } from '@/theme/tokens';

/**
 * A semana como a linha argila do símbolo: sobe suavemente da esquerda para a direita,
 * passando por cada dia. Dias com registro ficam preenchidos; o dia da aplicação vira a cápsula.
 */
export function WeekJourney({ activeDays, doseDays, today = new Date() }: { activeDays: Set<string>; doseDays: Set<string>; today?: Date }) {
  const [w, setW] = useState(320);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  const h = 96;
  const padX = 18;
  const week = startOfWeek(today);
  const todayIdx = today.getDay();

  const x = (i: number) => padX + (i / 6) * (w - padX * 2);
  // Curva ascendente, como o traço do logo: plana no início, subindo no fim.
  const y = (i: number) => 58 - Math.pow(i / 6, 2.2) * 34;

  const pts = Array.from({ length: 7 }, (_, i) => ({ x: x(i), y: y(i) }));
  const seg = (a: number, b: number) =>
    pts
      .slice(a, b + 1)
      .map((p, i, arr) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = arr[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
      })
      .join(' ');

  return (
    <View onLayout={onLayout}>
      <Svg width={w} height={h}>
        {todayIdx < 6 && <Path d={seg(todayIdx, 6)} stroke={palette.creme} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="3 6" fill="none" strokeLinecap="round" />}
        {todayIdx > 0 && <Path d={seg(0, todayIdx)} stroke={palette.argila} strokeWidth={3} fill="none" strokeLinecap="round" />}
        {pts.map((p, i) => {
          const k = dayKey(addDays(week, i));
          const isToday = i === todayIdx;
          const future = i > todayIdx;
          const active = activeDays.has(k);
          const dose = doseDays.has(k);
          return (
            <G key={k}>
              {dose ? (
                <G>
                  <Rect x={p.x - 13} y={p.y - 7} width={26} height={14} rx={7} fill={palette.floresta} stroke={palette.creme} strokeWidth={2} />
                  <Line x1={p.x} y1={p.y - 7} x2={p.x} y2={p.y + 7} stroke={palette.creme} strokeWidth={2} />
                </G>
              ) : isToday ? (
                <G>
                  <Circle cx={p.x} cy={p.y} r={11} fill="none" stroke={palette.argila} strokeWidth={2} />
                  <Circle cx={p.x} cy={p.y} r={5} fill={active ? palette.creme : palette.argila} />
                </G>
              ) : (
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 5.5 : 4}
                  fill={active ? palette.creme : future ? 'transparent' : palette.floresta}
                  stroke={future ? 'rgba(244,240,232,0.3)' : active ? palette.creme : 'rgba(244,240,232,0.5)'}
                  strokeWidth={1.5}
                />
              )}
              <SvgText
                x={p.x}
                y={h - 4}
                fontSize={11}
                textAnchor="middle"
                fill={isToday ? palette.creme : colors.textOnStrongMuted}
                fontFamily={isToday ? fonts.sansSemi : fonts.sans}>
                {isToday ? 'hoje' : WEEKDAYS_SHORT[i]}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
