import { Share2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Share } from 'react-native';

import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { BMI_LABEL, bmiClass, fmt, fmtInt, fmtMg } from '@/lib/calc';
import { addDays, dayKey, formatShort } from '@/lib/dates';
import { siteLabel } from '@/lib/medications';
import { medicationLabel } from '@/lib/treatment';
import { dayTotals, useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

export default function Report() {
  const plan = usePlan()!;
  const s = useStore();
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const t = s.treatment!;
    const p = plan.profile;
    const last14 = Array.from({ length: 14 }, (_, i) => dayKey(addDays(new Date(), -i)));
    const loggedDays = last14.filter((d) => s.meals.some((m) => m.day === d));
    const avg = (f: (d: string) => number) =>
      loggedDays.length ? loggedDays.reduce((a, d) => a + f(d), 0) / loggedDays.length : 0;
    const avgProt = avg((d) => dayTotals(s.meals.filter((m) => m.day === d)).protein);
    const avgKcal = avg((d) => dayTotals(s.meals.filter((m) => m.day === d)).kcal);
    const avgWater = last14.reduce((a, d) => a + (s.water[d] ?? 0), 0) / 14;
    const actMin = s.activities.filter((a) => last14.includes(a.day)).reduce((a, x) => a + x.minutes, 0);
    const effects = s.sideEffects.slice(0, 10);
    const gutBad = last14.filter((d) => s.checkins[d]?.gut === 'travado').length;

    const lines = [
      'RELATÓRIO DO TRATAMENTO · Além da Caneta',
      `Gerado em ${formatShort(new Date())} ${new Date().getFullYear()}`,
      '',
      `Paciente: ${p.name} · ${plan.age} anos · ${fmt(p.heightCm / 100, 2)} m`,
      `Medicamento: ${medicationLabel(t)} · dose atual ${fmtMg(t.doseMg)}`,
      `Início do acompanhamento: ${formatShort(new Date(t.startedAt))}`,
      '',
      'PESO',
      `Inicial ${fmt(p.startWeightKg)} kg → atual ${fmt(plan.weight)} kg (${plan.weight - p.startWeightKg <= 0 ? '−' : '+'}${fmt(Math.abs(plan.weight - p.startWeightKg))} kg)`,
      `IMC ${fmt(plan.bmi)} (${BMI_LABEL[bmiClass(plan.bmi)]}) · meta ${fmt(p.goalWeightKg)} kg`,
      '',
      'APLICAÇÕES (últimas 8)',
      ...s.doses.slice(0, 8).map((d) => `- ${formatShort(new Date(d.at))}: ${fmtMg(d.mg)}${d.site ? ` · ${siteLabel(d.site)}` : ''}`),
      '',
      'ÚLTIMOS 14 DIAS',
      `Proteína média: ${fmtInt(avgProt)} g/dia (meta ${plan.goals.protein} g) · ${loggedDays.length} dias com registro`,
      `Energia média: ${fmtInt(avgKcal)} kcal/dia`,
      `Água média: ${fmt(avgWater / 1000)} L/dia`,
      `Atividade física: ${actMin} min no período`,
      `Dias com intestino travado: ${gutBad}`,
      '',
      'EFEITOS COLATERAIS RECENTES',
      ...(effects.length
        ? effects.map((e) => `- ${formatShort(new Date(e.at))}: ${e.kind} (${['', 'leve', 'moderado', 'forte'][e.severity]})${e.note ? ` — ${e.note}` : ''}`)
        : ['- Nenhum registrado']),
      '',
      'Dados registrados pelo paciente. Estimativas nutricionais e de gasto energético são aproximadas.',
    ];
    return lines.join('\n');
  }, [s, plan]);

  async function share() {
    if (Platform.OS === 'web') {
      await navigator.clipboard?.writeText(text).catch(() => {});
      setCopied(true);
      return;
    }
    await Share.share({ message: text, title: 'Relatório do tratamento' });
  }

  return (
    <StackScreen title="Relatório">
      <Txt variant="small">Um resumo para levar à consulta. Compartilhe por WhatsApp, e-mail ou imprima.</Txt>
      <Button label={Platform.OS === 'web' ? (copied ? 'Copiado' : 'Copiar relatório') : 'Compartilhar'} icon={Share2} onPress={share} />
      <Card>
        <Txt variant="small" color={colors.text} style={{ fontFamily: fonts.sans, lineHeight: 20 }} selectable>
          {text}
        </Txt>
      </Card>
    </StackScreen>
  );
}
