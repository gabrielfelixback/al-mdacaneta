import { router } from 'expo-router';
import { ArrowDown, ArrowUp, Plus, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { ActivityCard } from '@/components/cards/ActivityCard';
import { CheckInCard } from '@/components/cards/CheckInCard';
import { NextDoseCard } from '@/components/cards/NextDoseCard';
import { NutritionCard } from '@/components/cards/NutritionCard';
import { WaterCard } from '@/components/cards/WaterCard';
import { TabScreen } from '@/components/Screen';
import { HeaderActions } from '@/components/StreakBadge';
import { Txt } from '@/components/Txt';
import { Card, Disclaimer, IconButton, ProgressBar, Row, Stat } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { fmt } from '@/lib/calc';
import { dayKey, formatShort, greeting, WEEKDAYS_LONG } from '@/lib/dates';
import { tipOfDay } from '@/lib/tips';
import { treatmentWeek } from '@/lib/treatment';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

export default function Today() {
  const plan = usePlan();
  const treatment = useStore((s) => s.treatment);
  const today = dayKey();
  const now = new Date();
  const tip = tipOfDay(now);
  if (!plan) return null;
  const first = plan.profile.name.split(' ')[0];

  return (
    <TabScreen
      title={`${greeting(now)},`}
      italicWord={first}
      right={<HeaderActions />}
      subtitle={
        <Txt variant="small" style={{ marginTop: 4 }}>
          {WEEKDAYS_LONG[now.getDay()]}, {formatShort(now)}
          {treatment ? ` · semana ${treatmentWeek(treatment, now)} do tratamento` : ''}
        </Txt>
      }>
      <NextDoseCard />
      <WeightMini />
      <WaterCard day={today} />
      <NutritionCard day={today} compact />
      <CheckInCard day={today} />
      <ActivityCard day={today} />

      <Card tone="soft" style={{ gap: space.sm }}>
        <Row gap={space.sm}>
          <Sparkles size={16} color={colors.accent} />
          <Txt variant="label" color={colors.accent}>
            Método 3P · {tip.p}
          </Txt>
        </Row>
        <Txt variant="h2">{tip.title}</Txt>
        <Txt variant="small">{tip.body}</Txt>
      </Card>
      <Disclaimer />
    </TabScreen>
  );
}

function WeightMini() {
  const plan = usePlan()!;
  const start = plan.profile.startWeightKg;
  const goal = plan.profile.goalWeightKg;
  const delta = plan.weight - start;
  const progress = start > goal ? (start - plan.weight) / (start - goal) : 0;

  return (
    <Card onPress={() => router.push('/perfil')}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={space.xl}>
          <Stat label="Peso atual" value={fmt(plan.weight)} unit="kg" />
          <Stat label="Meta" value={fmt(goal)} unit="kg" />
          {delta !== 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
                backgroundColor: colors.bgAlt,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radius.pill,
              }}>
              {delta <= 0 ? <ArrowDown size={14} color={colors.text} /> : <ArrowUp size={14} color={colors.text} />}
              <Txt variant="caption" color={colors.text}>
                {fmt(Math.abs(delta))} kg
              </Txt>
            </View>
          ) : null}
        </Row>
        <IconButton icon={Plus} size={34} label="Registrar peso" onPress={() => router.push('/peso')} />
      </Row>
      <ProgressBar value={progress} color={colors.cardStrong} height={6} />
    </Card>
  );
}
