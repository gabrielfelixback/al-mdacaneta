import { router } from 'expo-router';
import { Plus, Utensils } from 'lucide-react-native';
import { View } from 'react-native';

import { Ring } from '@/components/charts';
import { Txt } from '@/components/Txt';
import { Card, CardHeader, IconButton, ProgressBar, Row } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { fmtInt } from '@/lib/calc';
import { dayTotals, useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

/** Resumo do dia com a proteína no centro (P1 do Método 3P). */
export function NutritionCard({ day, compact }: { day: string; compact?: boolean }) {
  const meals = useStore((s) => s.meals);
  const plan = usePlan();
  if (!plan) return null;
  const t = dayTotals(meals.filter((m) => m.day === day));
  const g = plan.goals;
  const pct = t.protein / g.protein;
  const remaining = Math.max(0, g.protein - t.protein);

  return (
    <Card>
      <CardHeader
        icon={Utensils}
        title={compact ? 'Nutrição' : 'Resumo do dia'}
        right={
          compact ? (
            <IconButton icon={Plus} size={34} label="Registrar refeição" onPress={() => router.push({ pathname: '/refeicao', params: { day } })} />
          ) : undefined
        }
      />
      <Row gap={space.lg} style={{ alignItems: 'center' }}>
        <Ring value={pct} size={compact ? 132 : 156} stroke={compact ? 11 : 13} color={colors.protein}>
          <Txt variant="number" style={{ fontSize: compact ? 28 : 34 }}>
            {Math.round(t.protein)}
            <Txt variant="small"> g</Txt>
          </Txt>
          <Txt variant="caption">de {g.protein} g proteína</Txt>
        </Ring>
        <View style={{ flex: 1, gap: space.md }}>
          <View style={{ gap: 2 }}>
            <Txt variant="label">Energia</Txt>
            <Txt variant="bodyStrong" style={{ fontSize: 20 }}>
              {fmtInt(t.kcal)}
              <Txt variant="small"> / {fmtInt(g.kcal)} kcal</Txt>
            </Txt>
          </View>
          <Macro label="Carboidrato" value={t.carbs} goal={g.carbs} color={colors.carbs} />
          <Macro label="Gordura" value={t.fat} goal={g.fat} color={colors.fat} />
          <Macro label="Fibra" value={t.fiber} goal={g.fiber} color={colors.fiber} />
        </View>
      </Row>
      <Txt variant="small">
        {pct >= 1
          ? 'Proteína do dia batida. Seu músculo agradece.'
          : t.protein === 0
            ? 'Comece pela proteína: ovos, iogurte proteico ou um shake já contam.'
            : `Faltam ${Math.round(remaining)} g de proteína. Um iogurte proteico cobre ~15 g.`}
      </Txt>
    </Card>
  );
}

function Macro({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="caption">{label}</Txt>
        <Txt variant="caption" color={colors.text}>
          {Math.round(value)}/{goal} g
        </Txt>
      </Row>
      <ProgressBar value={value / goal} color={color} height={5} />
    </View>
  );
}
