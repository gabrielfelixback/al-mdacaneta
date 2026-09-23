import { router } from 'expo-router';
import { Activity, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';

import { WeekBars } from '@/components/charts';
import { Txt } from '@/components/Txt';
import { Card, CardHeader, Divider, IconButton, Row } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { getActivityType, INTENSITY_LABEL } from '@/lib/activities';
import { fmtInt } from '@/lib/calc';
import { addDays, dayKey, fromDayKey, startOfWeek } from '@/lib/dates';
import { health, type HealthDay } from '@/lib/health';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

export function ActivityCard({ day }: { day: string }) {
  const activities = useStore((s) => s.activities);
  const sync = useStore((s) => s.settings.healthSync);
  const updateSettings = useStore((s) => s.updateSettings);
  const plan = usePlan();
  const [healthDayState, setHealthDay] = useState<HealthDay | null>(null);
  const healthDay = sync ? healthDayState : null;

  const date = fromDayKey(day);
  const week = startOfWeek(date);
  const values = Array.from({ length: 7 }, (_, i) => {
    const k = dayKey(addDays(week, i));
    return activities.filter((a) => a.day === k).reduce((t, a) => t + a.kcal, 0);
  });
  const today = activities.filter((a) => a.day === day);
  const total = today.reduce((t, a) => t + a.kcal, 0);

  useEffect(() => {
    let alive = true;
    if (sync) health.readDay(date).then((d) => alive && setHealthDay(d)).catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync, day]);

  async function toggleSync(on: boolean) {
    if (!on) return updateSettings({ healthSync: false });
    const supported = await health.isSupported().catch(() => false);
    if (!supported) {
      const msg =
        Platform.OS === 'web'
          ? 'A integração funciona no app instalado no iPhone (Apple Saúde) ou Android (Health Connect).'
          : `${health.label} não está disponível neste aparelho.`;
      return Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Integração indisponível', msg);
    }
    const ok = await health.connect();
    updateSettings({ healthSync: ok });
  }

  return (
    <Card>
      <CardHeader
        icon={Activity}
        title="Movimento"
        right={<IconButton icon={Plus} size={34} label="Registrar atividade" onPress={() => router.push({ pathname: '/atividade', params: { day } })} />}
      />
      <Row gap={space.lg} style={{ alignItems: 'flex-end' }}>
        <View style={{ minWidth: 86 }}>
          <Txt variant="number">{fmtInt(total + (healthDay?.activeKcal ?? 0))}</Txt>
          <Txt variant="caption">kcal em atividade</Txt>
        </View>
        <View style={{ flex: 1 }}>
          <WeekBars values={values} todayIndex={date.getDay()} color={colors.textSecondary} height={78} />
        </View>
      </Row>

      {today.length > 0 && (
        <View style={{ gap: space.sm }}>
          {today.map((a) => (
            <Row key={a.id} style={{ justifyContent: 'space-between' }}>
              <Txt variant="small" color={colors.text}>
                {getActivityType(a.typeId).label} · {a.minutes} min · {INTENSITY_LABEL[a.intensity].toLowerCase()}
              </Txt>
              <Txt variant="small" color={colors.text}>
                {a.kcal} kcal
              </Txt>
            </Row>
          ))}
        </View>
      )}

      {healthDay ? (
        <Txt variant="small">
          Do {health.label}: {fmtInt(healthDay.steps)} passos · {fmtInt(healthDay.activeKcal)} kcal ativas
        </Txt>
      ) : null}

      {plan ? (
        <Txt variant="caption">
          Seu metabolismo basal estimado: {fmtInt(plan.bmr)} kcal/dia — o que o corpo gasta em repouso.
        </Txt>
      ) : null}

      <Divider />
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="small" color={colors.text}>
          Integrar com {Platform.OS === 'android' ? 'Health Connect' : Platform.OS === 'ios' ? 'Apple Saúde' : 'app de saúde'}
        </Txt>
        <Switch
          value={sync}
          onValueChange={toggleSync}
          trackColor={{ true: colors.cardStrong, false: colors.line }}
          thumbColor={colors.card}
        />
      </Row>
    </Card>
  );
}
