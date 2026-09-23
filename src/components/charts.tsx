import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { fmt } from '@/lib/calc';
import { formatDDMM, WEEKDAYS_SHORT } from '@/lib/dates';
import { colors, fonts } from '@/theme/tokens';
import { Txt } from './Txt';

function useWidth(initial = 300) {
  const [w, setW] = useState(initial);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  return [w, onLayout] as const;
}

// ---------- Anel (arco de 270°) ----------

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const sx = cx + r * Math.cos(rad(startDeg));
  const sy = cy + r * Math.sin(rad(startDeg));
  const ex = cx + r * Math.cos(rad(endDeg));
  const ey = cy + r * Math.sin(rad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

export function Ring({
  value,
  size = 180,
  stroke = 14,
  color = colors.accent,
  track = colors.track,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const start = -135;
  const sweep = 270;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Path d={arcPath(c, c, r, start, start + sweep)} stroke={track} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        {v > 0.005 && (
          <Path
            d={arcPath(c, c, r, start, start + sweep * v)}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

// ---------- Mini anel circular ----------

export function MiniRing({ value, size = 44, stroke = 5, color = colors.accent, track = colors.track }: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        strokeDashoffset={circ * (1 - v)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

// ---------- Linha de peso ----------

export function WeightChart({
  points,
  goal,
  height = 200,
}: {
  points: { date: Date; kg: number }[];
  goal?: number;
  height?: number;
}) {
  const [width, onLayout] = useWidth();
  if (points.length === 0) {
    return (
      <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
        <Txt variant="small">Registre seu peso para ver a curva.</Txt>
      </View>
    );
  }
  const padL = 30;
  const padR = 18;
  const padT = 26;
  const padB = 26;
  const values = points.map((p) => p.kg).concat(goal ? [goal] : []);
  let min = Math.floor(Math.min(...values) - 1);
  let max = Math.ceil(Math.max(...values) + 1);
  if (max - min < 4) {
    min -= 2;
    max += 2;
  }
  const t0 = points[0].date.getTime();
  const t1 = points[points.length - 1].date.getTime();
  const span = Math.max(1, t1 - t0);
  const x = (d: Date) => (points.length === 1 ? (padL + width - padR) / 2 : padL + ((d.getTime() - t0) / span) * (width - padL - padR));
  const y = (kg: number) => padT + (1 - (kg - min) / (max - min)) * (height - padT - padB);

  const line = points.map((p, i) => `${i ? 'L' : 'M'} ${x(p.date)} ${y(p.kg)}`).join(' ');
  const area = `${line} L ${x(points[points.length - 1].date)} ${height - padB} L ${x(points[0].date)} ${height - padB} Z`;
  const ticks = [min, Math.round((min + max) / 2), max];
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.support} stopOpacity={0.45} />
            <Stop offset="1" stopColor={colors.support} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        {ticks.map((t) => (
          <SvgText key={t} x={0} y={y(t) + 4} fontSize={10} fill={colors.textMuted} fontFamily={fonts.sans}>
            {t}
          </SvgText>
        ))}
        {goal ? (
          <>
            <Line x1={padL} x2={width - padR} y1={y(goal)} y2={y(goal)} stroke={colors.accent} strokeDasharray="5 5" strokeWidth={1.2} />
            <SvgText x={padL + 4} y={y(goal) - 6} fontSize={11} fill={colors.accent} fontFamily={fonts.sansSemi}>
              {`meta ${fmt(goal, 0)} kg`}
            </SvgText>
          </>
        ) : null}
        {points.length > 1 && <Path d={area} fill="url(#wfill)" />}
        <Path d={line} stroke={colors.cardStrong} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
        {points.map((p, i) => {
          const last = i === points.length - 1;
          const showLabel = last || i === 0 || i % labelEvery === 0;
          return (
            <G key={`${p.date.toISOString()}-${i}`}>
              <Circle cx={x(p.date)} cy={y(p.kg)} r={last ? 5.5 : 3.5} fill={last ? colors.cardStrong : colors.card} stroke={colors.cardStrong} strokeWidth={2} />
              {showLabel && (
                <SvgText x={x(p.date)} y={y(p.kg) - 10} fontSize={11} textAnchor="middle" fill={colors.text} fontFamily={fonts.sansSemi}>
                  {fmt(p.kg)}
                </SvgText>
              )}
              {(i === 0 || last || (points.length > 4 && i === Math.floor(points.length / 2))) && (
                <SvgText x={x(p.date)} y={height - 6} fontSize={10} textAnchor="middle" fill={colors.textMuted} fontFamily={fonts.sans}>
                  {formatDDMM(p.date)}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ---------- Curva do nível do medicamento ----------

export function LevelChart({
  series,
  nowIndex,
  height = 150,
  onStrong,
}: {
  series: { date: Date; mg: number }[];
  nowIndex: number;
  height?: number;
  onStrong?: boolean;
}) {
  const [width, onLayout] = useWidth();
  const max = Math.max(0.01, ...series.map((s) => s.mg)) * 1.15;
  const padB = 22;
  const x = (i: number) => 6 + (i / Math.max(1, series.length - 1)) * (width - 12);
  const y = (mg: number) => 8 + (1 - mg / max) * (height - padB - 8);
  const past = series.slice(0, nowIndex + 1);
  const future = series.slice(nowIndex);
  const toPath = (arr: typeof series, offset: number) =>
    arr.map((p, i) => `${i ? 'L' : 'M'} ${x(i + offset)} ${y(p.mg)}`).join(' ');
  const strokeC = onStrong ? colors.textOnStrong : colors.cardStrong;
  const muted = onStrong ? colors.textOnStrongMuted : colors.textMuted;
  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lfill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.5} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={`${toPath(past, 0)} L ${x(nowIndex)} ${height - padB} L ${x(0)} ${height - padB} Z`} fill="url(#lfill)" />
        <Path d={toPath(past, 0)} stroke={colors.accent} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
        <Path d={toPath(future, nowIndex)} stroke={strokeC} strokeOpacity={0.45} strokeDasharray="4 5" strokeWidth={2} fill="none" />
        <Line x1={x(nowIndex)} x2={x(nowIndex)} y1={6} y2={height - padB} stroke={muted} strokeWidth={1} strokeDasharray="2 4" />
        <Circle cx={x(nowIndex)} cy={y(series[nowIndex]?.mg ?? 0)} r={5} fill={colors.accent} stroke={onStrong ? colors.cardStrong : colors.card} strokeWidth={2} />
        {series.map((p, i) =>
          i % 7 === nowIndex % 7 ? (
            <SvgText key={i} x={Math.min(width - 18, Math.max(18, x(i)))} y={height - 4} fontSize={10} textAnchor="middle" fill={i === nowIndex ? strokeC : muted} fontFamily={i === nowIndex ? fonts.sansSemi : fonts.sans}>
              {i === nowIndex ? 'hoje' : formatDDMM(p.date)}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
}

// ---------- Barras semanais ----------

export function WeekBars({
  values,
  goal,
  todayIndex,
  color = colors.cardStrong,
  height = 90,
}: {
  values: number[];
  goal?: number;
  todayIndex: number;
  color?: string;
  height?: number;
}) {
  const [width, onLayout] = useWidth(240);
  const max = Math.max(goal ?? 0, ...values, 1);
  const gap = 8;
  const bw = (width - gap * 6) / 7;
  const barH = height - 18;
  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        {values.map((v, i) => {
          const h = Math.max(4, (v / max) * barH);
          const xPos = i * (bw + gap);
          return (
            <G key={i}>
              <Rect x={xPos} y={0} width={bw} height={barH} rx={bw / 2.6} fill={colors.track} />
              <Rect x={xPos} y={barH - h} width={bw} height={h} rx={bw / 2.6} fill={v > 0 ? color : 'transparent'} opacity={i === todayIndex ? 1 : 0.55} />
              <SvgText x={xPos + bw / 2} y={height - 2} fontSize={10} textAnchor="middle" fill={i === todayIndex ? colors.text : colors.textMuted} fontFamily={i === todayIndex ? fonts.sansSemi : fonts.sans}>
                {WEEKDAYS_SHORT[i]}
              </SvgText>
            </G>
          );
        })}
        {goal ? <Line x1={0} x2={width} y1={barH - (goal / max) * barH} y2={barH - (goal / max) * barH} stroke={colors.accent} strokeDasharray="3 4" strokeWidth={1} /> : null}
      </Svg>
    </View>
  );
}
