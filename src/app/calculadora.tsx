import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Card, Chip, Field, Row } from '@/components/ui';
import { doseToUnits, fmt, fmtMg } from '@/lib/calc';
import { getMedication } from '@/lib/medications';
import { parseNum } from '@/lib/parse';
import { useStore } from '@/store/useStore';
import { colors, fonts, space } from '@/theme/tokens';

/** Régua de 100 UI (seringa U-100 de 1 mL) com o volume marcado. */
function UnitsRuler({ units }: { units: number }) {
  const w = 300;
  const clamp = Math.max(0, Math.min(100, units));
  return (
    <Svg width="100%" height={56} viewBox={`0 0 ${w} 56`}>
      <Rect x={0} y={10} width={w} height={20} rx={10} fill={colors.track} />
      <Rect x={0} y={10} width={(clamp / 100) * w} height={20} rx={10} fill={colors.accent} />
      {Array.from({ length: 11 }).map((_, i) => (
        <Line key={i} x1={(i / 10) * w} x2={(i / 10) * w} y1={32} y2={i % 5 === 0 ? 42 : 38} stroke={colors.textMuted} strokeWidth={1} />
      ))}
      {[0, 50, 100].map((u) => (
        <SvgText key={u} x={(u / 100) * w} y={54} fontSize={10} textAnchor={u === 0 ? 'start' : u === 100 ? 'end' : 'middle'} fill={colors.textMuted} fontFamily={fonts.sans}>
          {u} UI
        </SvgText>
      ))}
    </Svg>
  );
}

export default function DoseCalculator() {
  const treatment = useStore((s) => s.treatment)!;
  const updateTreatment = useStore((s) => s.updateTreatment);
  const med = getMedication(treatment.medicationId);
  const [dose, setDose] = useState(treatment.doseMg.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
  const [conc, setConc] = useState(treatment.concentrationMgMl ? String(treatment.concentrationMgMl).replace('.', ',') : '');
  const d = parseNum(dose);
  const c = parseNum(conc);
  const valid = d > 0 && c > 0;
  const r = valid ? doseToUnits(d, c) : null;

  return (
    <StackScreen title="Calculadora de doses">
      <Txt variant="small">
        Para frascos ou canetas em que você puxa a dose com seringa de insulina U-100 (1 mL = 100 UI). Canetas com
        clique de dose fixa não precisam de cálculo.
      </Txt>
      <Field
        label="Concentração do frasco"
        value={conc}
        onChangeText={(v) => {
          setConc(v);
          const n = parseNum(v);
          if (n > 0) updateTreatment({ concentrationMgMl: n });
        }}
        keyboardType="decimal-pad"
        placeholder="Ex.: 10"
        suffix="mg/mL"
      />
      <Field label="Dose prescrita" value={dose} onChangeText={setDose} keyboardType="decimal-pad" suffix="mg" />
      <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
        {med.doses.map((x) => (
          <Chip key={x} small label={fmtMg(x)} active={d === x} onPress={() => setDose(String(x).replace('.', ','))} />
        ))}
      </Row>

      <Card tone="strong">
        <Txt variant="label" color={colors.textOnStrongMuted}>
          Puxar na seringa
        </Txt>
        <Txt variant="display" color={colors.textOnStrong} style={{ fontSize: 64, lineHeight: 68 }}>
          {r ? fmt(r.units, r.units % 1 ? 1 : 0) : '—'}
          <Txt variant="h2" color={colors.textOnStrongMuted}>
            {' '}
            UI
          </Txt>
        </Txt>
        <Txt variant="small" color={colors.textOnStrongMuted}>
          {r ? `= ${fmt(r.ml, 3)} mL` : 'Informe a concentração e a dose.'}
        </Txt>
        {r && r.units > 100 ? (
          <Txt variant="small" color={colors.support}>
            Passa de 100 UI: não cabe em uma seringa de 1 mL. Confira os valores com quem prescreveu.
          </Txt>
        ) : null}
      </Card>
      {r ? (
        <Card>
          <UnitsRuler units={r.units} />
        </Card>
      ) : null}
      <View style={{ gap: 4 }}>
        <Txt variant="caption">Fórmula: dose (mg) ÷ concentração (mg/mL) × 100 = unidades (UI).</Txt>
        <Txt variant="caption" color={colors.danger}>
          Confirme sempre com seu médico ou farmacêutico. A calculadora não substitui a prescrição.
        </Txt>
      </View>
    </StackScreen>
  );
}
