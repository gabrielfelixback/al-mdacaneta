import { router } from 'expo-router';
import { Activity, Droplet, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { MiniRing, Ring } from '@/components/charts';
import { Txt } from '@/components/Txt';
import { IconButton, tap } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { fmt, fmtInt } from '@/lib/calc';
import { health } from '@/lib/health';
import { dayTotals, useStore } from '@/store/useStore';
import { colors, fonts, palette, radius, space } from '@/theme/tokens';

const tile = { borderRadius: radius.lg, padding: space.lg } as const;

/** Bloco grande: proteína do dia (P1). */
export function ProteinTile({ day }: { day: string }) {
  const meals = useStore((s) => s.meals);
  const plan = usePlan()!;
  const t = dayTotals(meals.filter((m) => m.day === day));
  const goal = plan.goals.protein;
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push('/nutricao');
      }}
      style={({ pressed }) => [tile, { flex: 1.15, backgroundColor: colors.card, justifyContent: 'space-between', opacity: pressed ? 0.9 : 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt variant="label" color={colors.accent}>
          P1 · Proteína
        </Txt>
        <IconButton
          icon={Plus}
          size={30}
          label="Registrar refeição"
          onPress={() => router.push({ pathname: '/refeicao', params: { day } })}
        />
      </View>
      <View style={{ alignItems: 'center', marginVertical: space.sm }}>
        <Ring value={t.protein / goal} size={128} stroke={12} color={colors.protein}>
          <Txt variant="number" style={{ fontSize: 34, lineHeight: 38 }}>
            {Math.round(t.protein)}
          </Txt>
          <Txt variant="caption">de {goal} g</Txt>
        </Ring>
      </View>
      <Txt variant="caption" color={colors.textSecondary}>
        {fmtInt(t.kcal)} de {fmtInt(plan.goals.kcal)} kcal
      </Txt>
    </Pressable>
  );
}

/** Onda de água: o bloco enche conforme a meta. Toque soma um copo. */
export function WaterTile({ day }: { day: string }) {
  const ml = useStore((s) => s.water[day] ?? 0);
  const cup = useStore((s) => s.settings.cupMl);
  const sync = useStore((s) => s.settings.healthSync);
  const setWater = useStore((s) => s.setWater);
  const goal = usePlan()?.goals.waterMl ?? 2000;
  const pct = Math.min(1, ml / goal);

  return (
    <Pressable
      accessibilityLabel={`Adicionar ${cup} ml de água`}
      onPress={() => {
        tap();
        setWater(day, ml + cup);
        if (sync) health.writeWater(cup, new Date()).catch(() => {});
      }}
      onLongPress={() => setWater(day, ml - cup)}
      style={({ pressed }) => [tile, { flex: 1, backgroundColor: '#DCE5E6', overflow: 'hidden', transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.max(6, pct * 100)}%` }}>
        <Svg width="100%" height={12} viewBox="0 0 100 12" preserveAspectRatio="none" style={{ position: 'absolute', top: -11 }}>
          <Path d="M0 6 C 16 0, 34 12, 50 6 S 84 0, 100 6 V12 H0 Z" fill={colors.water} opacity={0.55} />
        </Svg>
        <View style={{ flex: 1, backgroundColor: colors.water, opacity: 0.55 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Droplet size={18} color={palette.floresta} strokeWidth={1.8} />
        <Txt variant="caption" color={palette.floresta}>
          +{cup} ml
        </Txt>
      </View>
      <Txt variant="number" color={palette.floresta} style={{ marginTop: space.sm, fontSize: 26 }}>
        {fmt(ml / 1000)}
        <Txt variant="small" color={palette.floresta}>
          {' '}
          / {fmt(goal / 1000)} L
        </Txt>
      </Txt>
      <Txt variant="caption" color={palette.musgo}>
        toque para somar um copo
      </Txt>
    </Pressable>
  );
}

export function MoveTile({ day }: { day: string }) {
  const activities = useStore((s) => s.activities);
  const today = activities.filter((a) => a.day === day);
  const kcal = today.reduce((t, a) => t + a.kcal, 0);
  const min = today.reduce((t, a) => t + a.minutes, 0);
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push({ pathname: '/atividade', params: { day } });
      }}
      style={({ pressed }) => [tile, { flex: 1, backgroundColor: colors.support, opacity: pressed ? 0.9 : 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Activity size={18} color={palette.floresta} strokeWidth={1.8} />
        <MiniRing value={min / 30} size={26} stroke={3.5} color={palette.floresta} track="rgba(23,51,43,0.15)" />
      </View>
      <Txt variant="number" color={palette.floresta} style={{ marginTop: space.sm, fontSize: 26 }}>
        {kcal}
        <Txt variant="small" color={palette.floresta}>
          {' '}
          kcal
        </Txt>
      </Txt>
      <Txt variant="caption" color={palette.musgo}>
        {min ? `${min} min de movimento` : 'registrar movimento'}
      </Txt>
    </Pressable>
  );
}

/** Peso com mini-curva e progresso até a meta. */
export function WeightTile() {
  const plan = usePlan()!;
  const weights = useStore((s) => s.weights);
  const start = plan.profile.startWeightKg;
  const goal = plan.profile.goalWeightKg;
  const delta = plan.weight - start;
  const progress = start > goal ? Math.max(0, Math.min(1, (start - plan.weight) / (start - goal))) : 0;
  const series = [...weights].reverse().slice(-10).map((w) => w.kg);

  const W = 120;
  const H = 40;
  const min = Math.min(...series, goal);
  const max = Math.max(...series);
  const span = Math.max(0.5, max - min);
  const spark = series
    .map((v, i) => `${i ? 'L' : 'M'} ${(i / Math.max(1, series.length - 1)) * W} ${4 + (1 - (v - min) / span) * (H - 8)}`)
    .join(' ');

  return (
    <Pressable
      onPress={() => {
        tap();
        router.push('/perfil');
      }}
      style={({ pressed }) => [tile, { backgroundColor: colors.card, gap: space.md, opacity: pressed ? 0.92 : 1 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <View style={{ flex: 1 }}>
          <Txt variant="label">Peso</Txt>
          <Txt variant="number" style={{ fontSize: 30 }}>
            {fmt(plan.weight)}
            <Txt variant="small"> kg</Txt>
          </Txt>
          <Txt variant="caption" color={delta <= 0 ? colors.textSecondary : colors.accent}>
            {delta === 0 ? `meta ${fmt(goal)} kg` : `${delta < 0 ? '−' : '+'}${fmt(Math.abs(delta))} kg desde o início`}
          </Txt>
        </View>
        {series.length > 1 ? (
          <Svg width={W} height={H}>
            <Path d={spark} stroke={colors.cardStrong} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </Svg>
        ) : null}
        <IconButton icon={Plus} size={34} label="Registrar peso" onPress={() => router.push('/peso')} />
      </View>
      <View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.track }}>
          <View style={{ width: `${progress * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.cardStrong }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Txt variant="caption">{fmt(start)} kg</Txt>
          <Txt variant="caption" style={{ fontFamily: fonts.sansSemi }} color={colors.text}>
            {Math.round(progress * 100)}% do caminho
          </Txt>
          <Txt variant="caption">{fmt(goal)} kg</Txt>
        </View>
      </View>
    </Pressable>
  );
}
