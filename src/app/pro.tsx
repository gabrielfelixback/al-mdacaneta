import { router } from 'expo-router';
import { BookOpen, CircleCheck, FileText, MessageCircleHeart, Sparkles, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCover, CapsuleMark } from '@/components/Brand';
import { Txt } from '@/components/Txt';
import { Button, Field, IconButton, Row, tap } from '@/components/ui';
import { formatShort } from '@/lib/dates';
import { LIBRARY } from '@/lib/library';
import { dismiss } from '@/lib/nav';
import { PLANS, purchase, redeemCode, type Plan } from '@/lib/purchases';
import { useStore } from '@/store/useStore';
import { colors, MAX_WIDTH, palette, radius, space } from '@/theme/tokens';

const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: BookOpen, title: 'Biblioteca do Método 3P', body: 'Os 8 materiais do curso: guia, cardápios, SOS, carrinho, intestino e Plano do Depois.' },
  { icon: Sparkles, title: 'Assistente sem limite', body: 'Dúvidas do dia a dia, receitas com a sua proteína e estratégias para os dias sem fome.' },
  { icon: FileText, title: 'Relatório em PDF para o médico', body: 'Evolução, adesão, sintomas e nutrição num documento pronto para a consulta.' },
  { icon: MessageCircleHeart, title: 'Suporte prioritário', body: 'Atendimento direto com o nosso time.' },
];

export default function Pro() {
  const insets = useSafeAreaInsets();
  const pro = useStore((s) => s.pro);
  const setPro = useStore((s) => s.setPro);
  const [plan, setPlan] = useState<Plan['id']>('anual');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<Parameters<typeof setPro>[0]>) {
    setBusy(true);
    setError(null);
    try {
      setPro(await fn());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cardStrong }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl }}>
        <View style={styles.inner}>
          <Row style={{ justifyContent: 'flex-end' }}>
            <IconButton icon={X} tone="onStrong" label="Fechar" onPress={dismiss} />
          </Row>

          <View style={{ alignItems: 'center', gap: space.md, marginTop: space.sm }}>
            <CapsuleMark size={34} color={colors.textOnStrong} animate />
            <Txt variant="display" color={colors.textOnStrong} align="center" style={{ fontSize: 48, lineHeight: 52 }}>
              <Txt italic color={colors.textOnStrong} style={{ fontSize: 48, lineHeight: 52 }}>
                além
              </Txt>{' '}
              Pro
            </Txt>
            <Txt variant="body" color={colors.textOnStrongMuted} align="center">
              O método completo, junto do seu acompanhamento.
            </Txt>
            {pro.active ? (
              <Row gap={6} style={styles.activeBadge}>
                <CircleCheck size={16} color={palette.salvia} />
                <Txt variant="bodyStrong" color={palette.salvia} style={{ fontSize: 14 }}>
                  Assinatura ativa
                </Txt>
              </Row>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg, marginVertical: space.lg }} contentContainerStyle={{ gap: space.md, paddingHorizontal: space.lg }}>
            {LIBRARY.map((it, i) => (
              <View key={it.id} style={{ width: 104, transform: [{ rotate: `${i % 2 ? 2 : -2}deg` }] }}>
                <BookCover small title={it.title} italic={it.italic} tone={it.tone === 'floresta' ? 'linho' : it.tone} tag={it.tag} />
              </View>
            ))}
          </ScrollView>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <Row key={b.title} style={{ alignItems: 'flex-start' }} gap={space.md}>
                <View style={styles.benefitIcon}>
                  <b.icon size={18} color={palette.argila} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong" color={colors.textOnStrong}>
                    {b.title}
                  </Txt>
                  <Txt variant="small" color={colors.textOnStrongMuted}>
                    {b.body}
                  </Txt>
                </View>
              </Row>
            ))}
          </View>

          {pro.active ? (
            <View style={{ gap: space.md, marginTop: space.xl }}>
              <Txt variant="small" align="center" color={colors.textOnStrongMuted}>
                {pro.plan === 'metodo3p' ? 'Acesso do Método 3P' : `Plano ${pro.plan}`}
                {pro.renewsAt ? ` · renova em ${formatShort(new Date(pro.renewsAt))} de ${new Date(pro.renewsAt).getFullYear()}` : ''}
              </Txt>
              <Button tone="onStrong" label="Abrir a biblioteca" icon={BookOpen} onPress={() => router.replace('/biblioteca')} />
            </View>
          ) : (
            <View style={{ gap: space.md, marginTop: space.xl }}>
              {PLANS.map((p) => {
                const active = plan === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      tap();
                      setPlan(p.id);
                    }}
                    style={[styles.plan, active && { borderColor: palette.argila, backgroundColor: 'rgba(184,116,79,0.14)' }]}>
                    <View style={[styles.radio, active && { borderColor: palette.argila }]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Row gap={space.sm}>
                        <Txt variant="bodyStrong" color={colors.textOnStrong}>
                          {p.label}
                        </Txt>
                        {p.badge ? (
                          <View style={styles.badge}>
                            <Txt variant="caption" color={colors.textOnStrong} style={{ fontSize: 10 }}>
                              {p.badge}
                            </Txt>
                          </View>
                        ) : null}
                      </Row>
                      <Txt variant="caption" color={colors.textOnStrongMuted}>
                        {p.detail}
                      </Txt>
                    </View>
                    <Txt variant="bodyStrong" color={colors.textOnStrong}>
                      {p.price}
                    </Txt>
                  </Pressable>
                );
              })}
              <Button tone="accent" label={busy ? 'Aguarde…' : 'Assinar o Pro'} disabled={busy} onPress={() => run(() => purchase(plan))} />

              {showCode ? (
                <View style={{ gap: space.sm }}>
                  <Field value={code} onChangeText={setCode} placeholder="Código do e-mail de compra" autoCapitalize="characters" />
                  <Button tone="onStrong" label="Resgatar acesso" disabled={busy || !code.trim()} onPress={() => run(() => redeemCode(code))} />
                </View>
              ) : (
                <Pressable onPress={() => setShowCode(true)}>
                  <Txt variant="small" align="center" color={colors.support} style={{ textDecorationLine: 'underline' }}>
                    Já comprei o Método 3P — tenho um código
                  </Txt>
                </Pressable>
              )}
              {error ? (
                <Txt variant="small" align="center" color="#F0B9A0">
                  {error}
                </Txt>
              ) : null}
              <Txt variant="caption" align="center" color={colors.textOnStrongMuted}>
                Cobrança pela App Store ou Google Play. Cancele quando quiser nas configurações da loja. O conteúdo é
                educacional e não substitui acompanhamento médico e nutricional.
              </Txt>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg },
  activeBadge: { backgroundColor: colors.trackOnStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  benefits: { backgroundColor: colors.trackOnStrong, borderRadius: radius.lg, padding: space.xl, gap: space.lg },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244,240,232,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1.5,
    borderColor: 'rgba(244,240,232,0.2)',
    borderRadius: radius.lg,
    padding: space.lg,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(244,240,232,0.4)', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.argila },
  badge: { backgroundColor: palette.argila, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
});
