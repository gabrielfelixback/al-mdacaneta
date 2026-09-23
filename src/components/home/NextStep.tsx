import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { tap } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { dayKey } from '@/lib/dates';
import { tipOfDay } from '@/lib/tips';
import { nextDoseInfo } from '@/lib/treatment';
import { dayTotals, useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

interface Step {
  kicker: string;
  title: string;
  italic: string;
  body: string;
  cta?: string;
  onPress?: () => void;
}

/** O próximo passo do dia, escolhido pelo que falta — em vez de uma lista fixa de cards. */
function useNextStep(now: Date): Step {
  const plan = usePlan()!;
  const treatment = useStore((s) => s.treatment);
  const doses = useStore((s) => s.doses);
  const meals = useStore((s) => s.meals);
  const water = useStore((s) => s.water);
  const weights = useStore((s) => s.weights);
  const setWater = useStore((s) => s.setWater);
  const cup = useStore((s) => s.settings.cupMl);
  const today = dayKey(now);
  const h = now.getHours();

  if (treatment && nextDoseInfo(treatment, doses, now).overdue) {
    return {
      kicker: 'Dia de aplicação',
      title: 'Hoje é dia da',
      italic: 'caneta',
      body: 'Registre a aplicação e deixe algo proteico pronto para as próximas 48 horas.',
      cta: 'Registrar aplicação',
      onPress: () => router.push('/aplicacao'),
    };
  }
  const t = dayTotals(meals.filter((m) => m.day === today));
  const missingProtein = plan.goals.protein - t.protein;
  if (h >= 11 && t.protein < plan.goals.protein * (h >= 17 ? 0.7 : 0.4)) {
    return {
      kicker: 'P1 · Proteína primeiro',
      title: `Faltam ${Math.round(missingProtein)} g de`,
      italic: 'proteína',
      body: 'Um iogurte proteico, dois ovos ou um shake já mudam o dia. Comece por ela.',
      cta: 'Registrar refeição',
      onPress: () => router.push('/refeicao'),
    };
  }
  if (h >= 14 && (water[today] ?? 0) < plan.goals.waterMl * 0.5) {
    return {
      kicker: 'P2 · Intestino em dia',
      title: 'Um copo de',
      italic: 'água agora',
      body: 'A caneta deixa a digestão mais lenta. Água ao longo do dia é o que mantém o intestino funcionando.',
      cta: `Somar ${cup} ml`,
      onPress: () => setWater(today, (water[today] ?? 0) + cup),
    };
  }
  const lastWeight = weights[0] ? new Date(weights[0].at).getTime() : 0;
  if (now.getTime() - lastWeight > 7 * 86_400_000) {
    return {
      kicker: 'Acompanhamento',
      title: 'Hora de registrar o',
      italic: 'peso',
      body: 'Uma vez por semana, no mesmo horário, já mostra a tendência.',
      cta: 'Registrar peso',
      onPress: () => router.push('/peso'),
    };
  }
  const tip = tipOfDay(now);
  return { kicker: `Método 3P · ${tip.p}`, title: tip.title, italic: '', body: tip.body };
}

export function NextStepCard({ now }: { now: Date }) {
  const step = useNextStep(now);
  return (
    <Pressable
      disabled={!step.onPress}
      onPress={() => {
        tap();
        step.onPress?.();
      }}
      style={({ pressed }) => ({
        backgroundColor: colors.accent,
        borderRadius: radius.lg,
        padding: space.xl,
        gap: space.sm,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <Txt variant="label" color="#F4E1D4">
        {step.kicker}
      </Txt>
      <Txt variant="h2" color={colors.textOnStrong} style={{ fontSize: 30, lineHeight: 33 }}>
        {step.title}
        {step.italic ? (
          <Txt variant="h2" italic color={colors.textOnStrong} style={{ fontSize: 30, lineHeight: 33 }}>
            {' '}
            {step.italic}
          </Txt>
        ) : null}
      </Txt>
      <Txt variant="small" color="#F7E7DC">
        {step.body}
      </Txt>
      {step.cta ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Txt variant="bodyStrong" color={colors.textOnStrong}>
            {step.cta}
          </Txt>
          <ArrowRight size={18} color={colors.textOnStrong} />
        </View>
      ) : null}
    </Pressable>
  );
}
