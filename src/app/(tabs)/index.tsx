import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Flame, Settings, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { CapsuleMark, Wordmark } from '@/components/Brand';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { CheckInCard } from '@/components/cards/CheckInCard';
import { MoveTile, ProteinTile, WaterTile, WeightTile } from '@/components/home/Bento';
import { LibraryRail } from '@/components/home/LibraryRail';
import { NextStepCard } from '@/components/home/NextStep';
import { WeekJourney } from '@/components/home/WeekJourney';
import { TAB_BAR_SPACE } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Disclaimer, IconButton, Row, tap } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { usePlan } from '@/hooks/usePlan';
import { fmtMg } from '@/lib/calc';
import { dayKey, formatCountdown, formatShort, greeting, WEEKDAYS_LONG } from '@/lib/dates';
import { medicationLabel, nextDoseInfo, treatmentWeek } from '@/lib/treatment';
import { activeDays, streak, useStore } from '@/store/useStore';
import { colors, MAX_WIDTH, palette, radius, space } from '@/theme/tokens';

export default function Today() {
  const insets = useSafeAreaInsets();
  const plan = usePlan();
  const now = useNow();
  const today = dayKey(now);
  // Topo escuro: barra de status clara só enquanto esta aba está em foco.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );
  if (!plan) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_SPACE }}
      showsVerticalScrollIndicator={false}>
      <Hero now={now} top={insets.top} />
      <View style={styles.body}>
        <NextStepCard now={now} />

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <ProteinTile day={today} />
          <View style={{ flex: 1, gap: space.md }}>
            <WaterTile day={today} />
            <MoveTile day={today} />
          </View>
        </View>
        <WeightTile />

        <CheckInCard day={today} />
        <LibraryRail />
        <AssistantTeaser />
        <ActivityCard day={today} />
        <Disclaimer />
      </View>
    </ScrollView>
  );
}

function Hero({ now, top }: { now: Date; top: number }) {
  const plan = usePlan()!;
  const treatment = useStore((s) => s.treatment);
  const doses = useStore((s) => s.doses);
  const logs = useStore(
    useShallow((s) => ({ meals: s.meals, activities: s.activities, water: s.water, weights: s.weights, doses: s.doses, checkins: s.checkins })),
  );
  const days = useMemo(() => activeDays(logs), [logs]);
  const n = useStore(streak);
  const first = plan.profile.name.split(' ')[0];
  const doseDays = new Set(doses.map((d) => dayKey(new Date(d.at))));
  const info = treatment ? nextDoseInfo(treatment, doses, now) : null;
  if (info && !info.overdue) doseDays.add(dayKey(info.next));
  const cd = info ? formatCountdown(info.next.getTime() - now.getTime()) : null;

  return (
    <View style={[styles.hero, { paddingTop: top + space.md }]}>
      <View style={styles.heroInner}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Wordmark size={17} color={colors.textOnStrong} />
          <Row gap={space.sm}>
            <View style={styles.streak}>
              <Flame size={14} color={n > 0 ? palette.argila : colors.textOnStrongMuted} />
              <Txt variant="bodyStrong" color={colors.textOnStrong} style={{ fontSize: 14 }}>
                {n}
              </Txt>
            </View>
            <IconButton icon={Settings} tone="onStrong" size={36} label="Configurações" onPress={() => router.push('/configuracoes')} />
          </Row>
        </Row>

        <View style={{ marginTop: space.xl }}>
          <Txt variant="h2" color={colors.textOnStrongMuted}>
            {greeting(now)},
          </Txt>
          <Txt italic color={colors.textOnStrong} style={{ fontSize: 60, lineHeight: 64 }}>
            {first}
          </Txt>
          <Txt variant="small" color={colors.textOnStrongMuted}>
            {WEEKDAYS_LONG[now.getDay()]}, {formatShort(now)}
            {treatment ? ` · semana ${treatmentWeek(treatment, now)} do tratamento` : ''}
          </Txt>
        </View>

        <View style={{ marginTop: space.lg, marginHorizontal: -space.sm }}>
          <WeekJourney activeDays={days} doseDays={doseDays} today={now} />
        </View>

        {treatment && info && cd ? (
          <Pressable
            onPress={() => {
              tap();
              router.push(info.overdue ? '/aplicacao' : '/doses');
            }}
            style={({ pressed }) => [styles.dosePill, pressed && { opacity: 0.85 }]}>
            <CapsuleMark size={16} color={colors.textOnStrong} progress={info.overdue ? 1 : Math.max(0.1, info.progress)} animate />
            <View style={{ flex: 1 }}>
              <Txt variant="caption" color={colors.textOnStrongMuted}>
                {info.overdue ? 'Aplicação de hoje' : 'Próxima aplicação'} · {medicationLabel(treatment)} {fmtMg(treatment.doseMg)}
              </Txt>
              <Txt variant="bodyStrong" color={colors.textOnStrong} style={{ fontSize: 17 }}>
                {info.overdue ? 'Toque para registrar' : `${cd.big} e ${cd.small}`}
              </Txt>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AssistantTeaser() {
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push('/assistente');
      }}
      style={({ pressed }) => [styles.assistant, pressed && { opacity: 0.9 }]}>
      <View style={styles.assistantIcon}>
        <Sparkles size={20} color={palette.argila} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="h3" color={colors.textOnStrong}>
          Pergunte ao{' '}
          <Txt variant="h3" italic color={colors.support} style={{ fontSize: 19 }}>
            método
          </Txt>
        </Txt>
        <Txt variant="caption" color={colors.textOnStrongMuted}>
          “O que comer hoje sem fome?” · “Receita com 30 g de proteína”
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.cardStrong,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: space.xl,
  },
  heroInner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg },
  body: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md, marginTop: space.lg },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.trackOnStrong,
  },
  dosePill: {
    marginTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.trackOnStrong,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  assistant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.cardStrong,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  assistantIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.trackOnStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
