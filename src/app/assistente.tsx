import { router } from 'expo-router';
import { ChevronLeft, Send, Sparkles, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CapsuleMark } from '@/components/Brand';
import { Txt } from '@/components/Txt';
import { IconButton, Row, tap } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { usePlan } from '@/hooks/usePlan';
import { API_URL } from '@/lib/api';
import { askAssistant, FREE_DAILY_QUESTIONS } from '@/lib/assistant';
import { fmtInt, fmtMg } from '@/lib/calc';
import { dayKey } from '@/lib/dates';
import { dismiss } from '@/lib/nav';
import { medicationLabel, nextDoseInfo } from '@/lib/treatment';
import { dayTotals, useStore } from '@/store/useStore';
import { colors, fonts, MAX_WIDTH, palette, radius, space } from '@/theme/tokens';

const SUGGESTIONS = [
  'Estou sem fome nenhuma hoje. O que comer?',
  'Receita rápida com 30 g de proteína',
  'Meu intestino travou. O que ajuda?',
  'O que pedir no restaurante japonês?',
  'Como me preparar para quando parar a caneta?',
];

/** Resumo do dia enviado ao assistente para respostas personalizadas. */
function useContextSummary() {
  const plan = usePlan();
  const now = useNow(300_000);
  const treatment = useStore((s) => s.treatment);
  const doses = useStore((s) => s.doses);
  const meals = useStore((s) => s.meals);
  const water = useStore((s) => s.water);
  const checkin = useStore((s) => s.checkins[dayKey()]);
  if (!plan) return '';
  const today = dayKey();
  const t = dayTotals(meals.filter((m) => m.day === today));
  const lines = [
    `Metas diárias: ${plan.goals.protein} g de proteína, ${fmtInt(plan.goals.kcal)} kcal, ${plan.goals.waterMl} ml de água, ${plan.goals.fiber} g de fibras.`,
    `Hoje até agora: ${Math.round(t.protein)} g de proteína, ${fmtInt(t.kcal)} kcal, ${water[today] ?? 0} ml de água, ${Math.round(t.fiber)} g de fibras.`,
  ];
  if (treatment) {
    const info = nextDoseInfo(treatment, doses);
    const since = info.last ? Math.floor((now.getTime() - new Date(info.last.at).getTime()) / 86_400_000) : null;
    lines.push(
      `Medicamento: ${medicationLabel(treatment)}, ${fmtMg(treatment.doseMg)}${since !== null ? `, última aplicação há ${since} dia(s)` : ''}.`,
    );
  }
  if (checkin) {
    lines.push(
      `Check-in de hoje: energia ${checkin.energy ?? '—'}/5, fome ${checkin.hunger ?? '—'}/5, intestino ${checkin.gut ?? '—'}.`,
    );
  }
  return lines.join('\n');
}

export default function Assistant() {
  const insets = useSafeAreaInsets();
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);
  const clearChat = useStore((s) => s.clearChat);
  const pro = useStore((s) => s.pro.active);
  const used = useStore((s) => s.assistantUsage[dayKey()] ?? 0);
  const countUse = useStore((s) => s.countAssistantUse);
  const context = useContextSummary();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const left = FREE_DAILY_QUESTIONS - used;
  const blocked = !pro && left <= 0;

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    if (!API_URL) {
      setError('O assistente ainda não está ligado nesta versão de teste.');
      return;
    }
    if (blocked) return router.push('/pro');
    tap();
    setText('');
    setError(null);
    addChat({ role: 'user', text: question });
    setBusy(true);
    try {
      const history = [...useStore.getState().chat].map((m) => ({ role: m.role, text: m.text }));
      const answer = await askAssistant(history, context);
      addChat({ role: 'assistant', text: answer });
      countUse(dayKey());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.inner}>
          <Row style={{ justifyContent: 'space-between' }}>
            <IconButton icon={ChevronLeft} tone="onStrong" label="Voltar" onPress={dismiss} />
            {chat.length ? <IconButton icon={Trash2} tone="onStrong" label="Limpar conversa" onPress={clearChat} /> : null}
          </Row>
          <Row style={{ marginTop: space.md }} gap={space.md}>
            <CapsuleMark size={20} color={colors.textOnStrong} animate />
            <Txt variant="title" color={colors.textOnStrong}>
              Pergunte ao{' '}
              <Txt variant="title" italic color={colors.support}>
                método
              </Txt>
            </Txt>
          </Row>
          <Txt variant="small" color={colors.textOnStrongMuted} style={{ marginTop: 4 }}>
            {pro ? 'Assistente ilimitado no Pro.' : `${Math.max(0, left)} de ${FREE_DAILY_QUESTIONS} perguntas grátis hoje.`}
          </Txt>
        </View>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={{ paddingVertical: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={[styles.inner, { gap: space.md }]}>
          {!API_URL ? (
            <View style={{ backgroundColor: colors.bgAlt, borderRadius: radius.md, padding: space.lg }}>
              <Txt variant="bodyStrong">O assistente ainda não está ligado nesta versão de teste.</Txt>
              <Txt variant="small">Você pode ver como ele funciona; as respostas chegam na próxima versão.</Txt>
            </View>
          ) : null}
          {chat.length === 0 ? (
            <View style={{ gap: space.sm }}>
              <Txt variant="small">
                Dúvidas de rotina, receitas com a sua proteína e estratégias para os dias sem fome. Para dose e ajuste de
                medicamento, fale com quem prescreveu.
              </Txt>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => send(s)} style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}>
                  <Sparkles size={14} color={colors.accent} />
                  <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
                    {s}
                  </Txt>
                </Pressable>
              ))}
            </View>
          ) : (
            chat.map((m) => (
              <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.user : styles.bot]}>
                <Txt variant="body" color={m.role === 'user' ? colors.textOnStrong : colors.text} selectable>
                  {m.text}
                </Txt>
              </View>
            ))
          )}
          {busy ? (
            <Row gap={space.sm}>
              <ActivityIndicator color={colors.accent} />
              <Txt variant="small">Pensando no seu caso…</Txt>
            </Row>
          ) : null}
          {error ? (
            <Txt variant="small" color={colors.danger}>
              {error}
            </Txt>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.inner, { paddingBottom: insets.bottom + space.md, paddingTop: space.sm }]}>
        {blocked ? (
          <Pressable onPress={() => router.push('/pro')} style={styles.blocked}>
            <Txt variant="bodyStrong" color={colors.textOnStrong}>
              Você usou as perguntas de hoje.{' '}
              <Txt variant="bodyStrong" color={palette.salvia}>
                Conheça o Pro
              </Txt>
            </Txt>
          </Pressable>
        ) : (
          <Row style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escreva sua dúvida"
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.input}
              onSubmitEditing={() => send(text)}
            />
            <IconButton icon={Send} tone="strong" size={42} label="Enviar" onPress={() => send(text)} />
          </Row>
        )}
        <Txt variant="caption" align="center" style={{ marginTop: 6 }}>
          Respostas geradas por IA. Não substituem acompanhamento médico e nutricional.
        </Txt>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.cardStrong, paddingBottom: space.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
  },
  bubble: { maxWidth: '88%', borderRadius: radius.lg, padding: space.md },
  user: { alignSelf: 'flex-end', backgroundColor: colors.cardStrong, borderBottomRightRadius: 6 },
  bot: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 6 },
  composer: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    paddingLeft: space.lg,
    paddingRight: 5,
    paddingVertical: 5,
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.text, maxHeight: 120, paddingVertical: 8, outlineStyle: 'none' } as object,
  blocked: { backgroundColor: colors.cardStrong, borderRadius: radius.lg, padding: space.lg, alignItems: 'center' },
});
