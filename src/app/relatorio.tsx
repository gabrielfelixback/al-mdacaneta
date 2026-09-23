import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Check, FileText, HeartPulse, Ruler, TrendingDown, UserRound, Utensils } from 'lucide-react-native';
import { useMemo, useState, type ComponentType } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { CapsuleIcon } from '@/components/Brand';
import { HtmlPreview } from '@/components/HtmlPreview';
import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Divider, Row, Segmented, tap } from '@/components/ui';
import { buildReportHtml, REPORT_SECTIONS, sectionCounts, type ReportPeriod, type ReportSection } from '@/lib/report';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

const ICONS: Record<ReportSection, ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  identificacao: UserRound,
  tratamento: CapsuleIcon,
  peso: TrendingDown,
  medidas: Ruler,
  sintomas: HeartPulse,
  nutricao: Utensils,
};

export default function Report() {
  const data = useStore(
    useShallow((s) => ({
      profile: s.profile,
      treatment: s.treatment,
      doses: s.doses,
      weights: s.weights,
      meals: s.meals,
      water: s.water,
      sideEffects: s.sideEffects,
      checkins: s.checkins,
    })),
  );
  const pro = useStore((s) => s.pro.active);
  const [period, setPeriod] = useState<ReportPeriod>('inicio');
  const [selected, setSelected] = useState<Set<ReportSection>>(() => new Set(REPORT_SECTIONS.map((s) => s.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const counts = useMemo(() => sectionCounts(data, period), [data, period]);
  const total = Object.values(counts).reduce<number>((a, b) => a + (b ?? 0), 0);

  function toggle(id: ReportSection) {
    tap();
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function generate() {
    if (!pro) return router.push('/pro');
    setBusy(true);
    setError(null);
    try {
      const html = buildReportHtml(data, period, selected);
      if (Platform.OS === 'web') {
        // No navegador, abrir janelas e imprimir pode ser bloqueado: mostramos a prévia aqui mesmo.
        setPreview(html);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Relatório do tratamento' });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <StackScreen title="Relatório para consulta">
      <Txt variant="small">Um PDF com a sua evolução, pronto para levar ao médico. Escolha o período e as seções.</Txt>

      <Card tone="strong">
        <Row style={{ justifyContent: 'space-around' }}>
          {[
            { v: String(selected.size), l: 'seções' },
            { v: String(total), l: 'registros' },
            { v: 'PDF', l: 'formato' },
          ].map((x) => (
            <View key={x.l} style={{ alignItems: 'center' }}>
              <Txt variant="display" color={colors.textOnStrong} style={{ fontSize: 38, lineHeight: 42 }}>
                {x.v}
              </Txt>
              <Txt variant="label" color={colors.textOnStrongMuted}>
                {x.l}
              </Txt>
            </View>
          ))}
        </Row>
      </Card>

      <Txt variant="label">Período</Txt>
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'inicio', label: 'Desde o início' },
          { value: '90', label: '90 dias' },
          { value: '30', label: '30 dias' },
        ]}
      />

      <Txt variant="label">O que incluir</Txt>
      <Card style={{ paddingVertical: space.sm, gap: 0 }}>
        {REPORT_SECTIONS.map((s, i) => {
          const Icon = ICONS[s.id];
          const on = selected.has(s.id);
          const c = counts[s.id];
          return (
            <View key={s.id}>
              {i > 0 && <Divider />}
              <Pressable onPress={() => toggle(s.id)} style={{ paddingVertical: space.md }}>
                <Row>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={colors.text} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Row gap={6}>
                      <Txt variant="bodyStrong">{s.title}</Txt>
                      {c !== undefined ? (
                        <View style={{ backgroundColor: colors.bgAlt, borderRadius: radius.pill, paddingHorizontal: 8 }}>
                          <Txt variant="caption" color={colors.text}>
                            {c}
                          </Txt>
                        </View>
                      ) : null}
                    </Row>
                    <Txt variant="caption">{s.desc}</Txt>
                  </View>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: on ? colors.cardStrong : 'transparent',
                      borderWidth: on ? 0 : 1.5,
                      borderColor: colors.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {on ? <Check size={15} color={colors.textOnStrong} strokeWidth={2.5} /> : null}
                  </View>
                </Row>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Button
        label={busy ? 'Gerando…' : !pro ? 'Gerar PDF · Pro' : Platform.OS === 'web' ? 'Ver relatório' : 'Gerar PDF e compartilhar'}
        icon={FileText}
        disabled={busy || selected.size === 0}
        onPress={generate}
      />
      {error ? (
        <Txt variant="small" color={colors.danger}>
          {error}
        </Txt>
      ) : null}
      {preview ? (
        <>
          <Txt variant="caption">Na versão web o relatório aparece aqui; no app instalado ele vira PDF para compartilhar.</Txt>
          <HtmlPreview html={preview} />
        </>
      ) : null}
      <Txt variant="caption">
        Inclui resumo com adesão às aplicações, ritmo de perda, IMC, sintomas e médias de proteína e água. Dados
        autorreportados.
      </Txt>
    </StackScreen>
  );
}
