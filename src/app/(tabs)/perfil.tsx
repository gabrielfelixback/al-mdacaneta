import { router } from 'expo-router';
import { ArrowDown, ArrowUp, ChevronRight, FileText, History, Plus, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { WeightChart } from '@/components/charts';
import { Avatar } from '@/components/PostCard';
import { TabScreen } from '@/components/Screen';
import { HeaderActions } from '@/components/StreakBadge';
import { Txt } from '@/components/Txt';
import { Card, CardHeader, IconButton, ProgressBar, Row, Segmented } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { usePlan } from '@/hooks/usePlan';
import { BMI_LABEL, bmiClass, bmiScalePosition, fmt } from '@/lib/calc';
import { addDays, dayKey } from '@/lib/dates';
import { dayTotals, useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

type Range = '15d' | '2m' | '6m' | 'tudo';
const RANGE_DAYS: Record<Range, number> = { '15d': 15, '2m': 61, '6m': 183, tudo: 100000 };

export default function Profile() {
  const plan = usePlan();
  const weights = useStore((s) => s.weights);
  const pro = useStore((s) => s.pro.active);
  const [range, setRange] = useState<Range>('tudo');
  const now = useNow(3_600_000);
  if (!plan) return null;
  const { profile } = plan;

  const start = profile.startWeightKg;
  const goal = profile.goalWeightKg;
  const lost = start - plan.weight;
  const progress = start > goal ? lost / (start - goal) : 0;
  const cutoff = now.getTime() - RANGE_DAYS[range] * 86_400_000;
  const points = [...weights]
    .filter((w) => new Date(w.at).getTime() >= cutoff)
    .reverse()
    .map((w) => ({ date: new Date(w.at), kg: w.kg }));
  const cls = bmiClass(plan.bmi);
  const bmiColor = { abaixo: colors.bmiUnder, saudavel: colors.bmiHealthy, sobrepeso: colors.bmiOver, obesidade: colors.bmiObese }[cls];

  return (
    <TabScreen title="Meu" italicWord="progresso" right={<HeaderActions />}>
      <Card onPress={() => router.push('/meus-dados')}>
        <Row>
          <Avatar name={profile.name} size={52} />
          <View style={{ flex: 1 }}>
            <Row gap={space.sm}>
              <Txt variant="h2">{profile.name}</Txt>
              {pro ? (
                <View style={{ backgroundColor: colors.cardStrong, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Txt variant="caption" color={colors.textOnStrong} style={{ fontSize: 10 }}>
                    PRO
                  </Txt>
                </View>
              ) : null}
            </Row>
            <Txt variant="small">
              {fmt(profile.heightCm / 100, 2)} m · {plan.age} anos
            </Txt>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Row>
      </Card>

      <Card tone="strong">
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="label" color={colors.textOnStrongMuted}>
            Peso atual
          </Txt>
          <IconButton icon={Plus} tone="onStrong" size={36} label="Registrar peso" onPress={() => router.push('/peso')} />
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Txt variant="display" color={colors.textOnStrong} style={{ fontSize: 60, lineHeight: 64 }}>
            {fmt(plan.weight)}
            <Txt variant="h2" color={colors.textOnStrongMuted}>
              {' '}
              kg
            </Txt>
          </Txt>
          {lost !== 0 ? (
            <Row gap={4} style={{ backgroundColor: colors.trackOnStrong, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
              {lost > 0 ? <ArrowDown size={15} color={colors.support} /> : <ArrowUp size={15} color={colors.support} />}
              <Txt variant="bodyStrong" color={colors.support}>
                {fmt(Math.abs(lost))} kg
              </Txt>
            </Row>
          ) : null}
        </Row>
        <ProgressBar value={progress} color={colors.accent} track={colors.trackOnStrong} height={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="small" color={colors.textOnStrongMuted}>
            Início: {fmt(start)} kg
          </Txt>
          <Txt variant="small" color={colors.textOnStrongMuted}>
            Meta: {fmt(goal)} kg
          </Txt>
        </Row>
      </Card>

      <Card>
        <CardHeader
          title="IMC"
          right={
            <View style={{ backgroundColor: bmiColor + '26', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill }}>
              <Txt variant="caption" color={bmiColor} style={{ fontSize: 12 }}>
                {BMI_LABEL[cls]}
              </Txt>
            </View>
          }
        />
        <Txt variant="display">{fmt(plan.bmi)}</Txt>
        <Txt variant="caption">
          {fmt(plan.weight)} kg ÷ ({fmt(profile.heightCm / 100, 2)} m)²
        </Txt>
        <View style={{ marginTop: space.sm }}>
          <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ flex: 3.5, backgroundColor: colors.bmiUnder }} />
            <View style={{ flex: 6.5, backgroundColor: colors.bmiHealthy }} />
            <View style={{ flex: 5, backgroundColor: colors.bmiOver }} />
            <View style={{ flex: 10, backgroundColor: colors.bmiObese }} />
          </View>
          <View
            style={{
              position: 'absolute',
              left: `${bmiScalePosition(plan.bmi) * 100}%`,
              top: -5,
              width: 4,
              height: 18,
              marginLeft: -2,
              borderRadius: 2,
              backgroundColor: colors.text,
              borderWidth: 1,
              borderColor: colors.card,
            }}
          />
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          {(['abaixo', 'saudavel', 'sobrepeso', 'obesidade'] as const).map((c) => (
            <Txt key={c} variant="caption">
              {BMI_LABEL[c]}
            </Txt>
          ))}
        </Row>
        <Txt variant="caption">O IMC é um indicador populacional (OMS); não mede composição corporal.</Txt>
      </Card>

      <Card>
        <CardHeader title="Evolução do peso" />
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: '15d', label: '15D' },
            { value: '2m', label: '2M' },
            { value: '6m', label: '6M' },
            { value: 'tudo', label: 'Tudo' },
          ]}
        />
        <WeightChart points={points} goal={goal} />
      </Card>

      <BeyondScale />

      <Card onPress={() => router.push('/historico-peso')}>
        <Row>
          <History size={20} color={colors.text} />
          <Txt variant="h3" style={{ flex: 1 }}>
            Registros de peso ({weights.length})
          </Txt>
          <ChevronRight size={20} color={colors.textMuted} />
        </Row>
      </Card>
      <Card onPress={() => router.push('/relatorio')}>
        <Row>
          <FileText size={20} color={colors.text} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">Relatório para o médico</Txt>
            <Txt variant="small">Resumo do tratamento para levar à consulta</Txt>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Row>
      </Card>
    </TabScreen>
  );
}

/** Evolução além da balança: últimos 7 dias de proteína, água, energia e intestino. */
function BeyondScale() {
  const plan = usePlan()!;
  const meals = useStore((s) => s.meals);
  const water = useStore((s) => s.water);
  const checkins = useStore((s) => s.checkins);
  const days = Array.from({ length: 7 }, (_, i) => dayKey(addDays(new Date(), -i)));

  const proteinDays = days.filter((d) => dayTotals(meals.filter((m) => m.day === d)).protein >= plan.goals.protein * 0.9).length;
  const waterDays = days.filter((d) => (water[d] ?? 0) >= plan.goals.waterMl).length;
  const energies = days.map((d) => checkins[d]?.energy).filter((e): e is NonNullable<typeof e> => !!e);
  const gutOk = days.filter((d) => checkins[d]?.gut === 'normal').length;
  const avgEnergy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;

  const items = [
    { label: 'Dias com proteína batida', value: `${proteinDays}/7`, pct: proteinDays / 7 },
    { label: 'Dias com água em dia', value: `${waterDays}/7`, pct: waterDays / 7 },
    { label: 'Intestino em dia', value: `${gutOk}/7`, pct: gutOk / 7 },
    { label: 'Energia média', value: avgEnergy ? `${fmt(avgEnergy)}/5` : '—', pct: avgEnergy / 5 },
  ];

  return (
    <Card>
      <CardHeader icon={Sprout} title="Além da balança · 7 dias" />
      {items.map((it) => (
        <View key={it.label} style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="small" color={colors.text}>
              {it.label}
            </Txt>
            <Txt variant="bodyStrong">{it.value}</Txt>
          </Row>
          <ProgressBar value={it.pct} color={colors.textSecondary} height={5} />
        </View>
      ))}
    </Card>
  );
}
