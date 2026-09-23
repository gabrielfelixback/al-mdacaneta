import { Info, Share2, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Share, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, Divider, Field, Row, Segmented } from '@/components/ui';
import { fmtMg } from '@/lib/calc';
import { getMedication, type ActiveIngredient } from '@/lib/medications';
import { parseNum } from '@/lib/parse';
import { medicationLabel } from '@/lib/treatment';
import { useStore } from '@/store/useStore';
import { colors, fonts, palette, radius, space } from '@/theme/tokens';

const VIALS: Record<ActiveIngredient, number[]> = {
  tirzepatida: [10, 12.5, 15, 20, 30, 40, 60],
  semaglutida: [2, 3, 4, 5, 10, 20],
  liraglutida: [18],
  dulaglutida: [3, 6],
};
const TABLE_STEP: Record<ActiveIngredient, number> = { tirzepatida: 1.25, semaglutida: 0.25, liraglutida: 0.6, dulaglutida: 0.75 };
const VOLUMES = [0.5, 1, 2, 3];
const SYRINGES = [30, 50, 100] as const;
type Syringe = (typeof SYRINGES)[number];

const tickOf = (s: Syringe) => (s === 100 ? 2 : 1);
const num = (n: number, d = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: d });

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Row>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="bodyStrong" style={{ fontSize: 13 }}>
            {n}
          </Txt>
        </View>
        <Txt variant="h3">{title}</Txt>
      </Row>
      {children}
    </Card>
  );
}

/** Régua em UI do tamanho da seringa, com o volume marcado. */
function UnitsRuler({ units, max, tick }: { units: number; max: number; tick: number }) {
  const w = 320;
  const x = (u: number) => 8 + (u / max) * (w - 16);
  const label = max === 30 ? 5 : 10;
  const ticks = Array.from({ length: Math.floor(max / tick) + 1 }, (_, i) => i * tick);
  return (
    <Svg width="100%" height={70} viewBox={`0 0 ${w} 70`}>
      <Rect x={8} y={8} width={w - 16} height={26} rx={8} fill={colors.track} />
      <Rect x={8} y={8} width={Math.max(0, x(Math.min(units, max)) - 8)} height={26} rx={8} fill={palette.argila} />
      <Line x1={x(Math.min(units, max))} x2={x(Math.min(units, max))} y1={2} y2={40} stroke={palette.floresta} strokeWidth={2.5} />
      {ticks.map((u) => (
        <Line key={u} x1={x(u)} x2={x(u)} y1={36} y2={u % label === 0 ? 48 : 42} stroke={colors.textSecondary} strokeWidth={u % label === 0 ? 1.4 : 0.8} />
      ))}
      {ticks
        .filter((u) => u % label === 0)
        .map((u) => (
          <SvgText key={`l${u}`} x={x(u)} y={64} fontSize={11} textAnchor="middle" fill={colors.textSecondary} fontFamily={fonts.sans}>
            {u}
          </SvgText>
        ))}
    </Svg>
  );
}

export default function DoseCalculator() {
  const treatment = useStore((s) => s.treatment)!;
  const update = useStore((s) => s.updateTreatment);
  const med = getMedication(treatment.medicationId);
  const vials = VIALS[med.ingredient];

  const [mode, setMode] = useState<'puxar' | 'puxei'>('puxar');
  const [vialMg, setVialMg] = useState(num(treatment.vialMg ?? vials[Math.min(2, vials.length - 1)]));
  const [vialMl, setVialMl] = useState(num(treatment.vialMl ?? 0.5));
  const [dose, setDose] = useState(num(treatment.doseMg));
  const [pulled, setPulled] = useState('');
  const [syringe, setSyringe] = useState<Syringe>(treatment.syringeUi ?? 50);

  const mg = parseNum(vialMg);
  const ml = parseNum(vialMl);
  const conc = mg > 0 && ml > 0 ? mg / ml : 0;
  const tick = tickOf(syringe);
  const mgPerUi = conc / 100;

  const d = parseNum(dose);
  const exactUi = conc && d > 0 ? (d / conc) * 100 : 0;
  const roundedUi = Math.round(exactUi / tick) * tick;
  const deliveredMg = roundedUi * mgPerUi;
  const diffPct = d > 0 ? ((deliveredMg - d) / d) * 100 : 0;

  const pulledUi = parseNum(pulled);
  const pulledMg = conc && pulledUi > 0 ? pulledUi * mgPerUi : 0;

  const persist = (p: Parameters<typeof update>[0]) => update(p);

  const table: { mg: number; exact: number; rounded: number }[] = [];
  if (conc) {
    const step = TABLE_STEP[med.ingredient];
    for (let v = step; v <= Math.min(mg, step * 24) + 1e-9; v += step) {
      const ex = (v / conc) * 100;
      if (ex > syringe) break;
      table.push({ mg: Math.round(v * 100) / 100, exact: ex, rounded: Math.round(ex / tick) * tick });
    }
  }

  function shareTable() {
    const lines = [
      `${medicationLabel(treatment)} · ${num(mg)} mg / ${num(ml)} mL = ${num(conc)} mg/mL`,
      `Seringa de ${syringe} UI (U-100)`,
      '',
      ...table.map((r) => `${num(r.mg)} mg → ${r.rounded} UI${Math.abs(r.exact - r.rounded) > 0.05 ? ` (≈ ${num(r.exact, 1)})` : ''}`),
      '',
      'Válido só para esta concentração e seringa. Confira o rótulo do frasco e a dose prescrita. — Além da Caneta',
    ];
    Share.share({ message: lines.join('\n') }).catch(() => {});
  }

  return (
    <StackScreen title="Calculadora de doses">
      <Card tone="strong" style={{ alignItems: 'center' }}>
        <Txt variant="label" color={colors.textOnStrongMuted}>
          {mode === 'puxar' ? 'Puxe até' : 'Você puxou'}
        </Txt>
        <Txt variant="display" color={colors.textOnStrong} style={{ fontSize: 72, lineHeight: 76 }}>
          {mode === 'puxar' ? (exactUi ? roundedUi : '—') : pulledMg ? num(pulledMg) : '—'}
          <Txt variant="h2" italic color={colors.support}>
            {' '}
            {mode === 'puxar' ? 'UI' : 'mg'}
          </Txt>
        </Txt>
        <Txt variant="small" color={colors.textOnStrongMuted} align="center">
          {mode === 'puxar'
            ? exactUi
              ? `${num(deliveredMg)} mg · ${num(roundedUi / 100, 3)} mL`
              : 'Informe o frasco e a dose prescrita.'
            : pulledMg
              ? `${num(pulledUi)} UI · ${num(pulledUi / 100, 3)} mL`
              : 'Informe o frasco e quantas UI você puxou.'}
        </Txt>
        {mode === 'puxar' && exactUi > syringe ? (
          <Txt variant="small" color={palette.salvia} align="center">
            Não cabe em uma seringa de {syringe} UI. Confira os valores com quem prescreveu.
          </Txt>
        ) : null}
      </Card>

      {mode === 'puxar' && exactUi > 0 && exactUi <= syringe ? (
        <Card>
          <UnitsRuler units={roundedUi} max={syringe} tick={tick} />
          <Txt variant="caption" align="center">
            0–{syringe} UI · {num(syringe / 100)} mL · traços de {tick} em {tick} UI
          </Txt>
          {Math.abs(exactUi - roundedUi) > 0.05 ? (
            <Txt variant="small" align="center">
              O valor exato é {num(exactUi, 1)} UI. A marca de {roundedUi} UI entrega {num(deliveredMg)} mg —{' '}
              {num(Math.abs(deliveredMg - d))} mg a {diffPct < 0 ? 'menos' : 'mais'} ({num(Math.abs(diffPct), 0)}%).
            </Txt>
          ) : null}
        </Card>
      ) : null}

      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'puxar', label: 'Quanto puxar' },
          { value: 'puxei', label: 'Quanto puxei' },
        ]}
      />

      <Step n={1} title="Seu frasco">
        <Txt variant="small">{medicationLabel(treatment)}</Txt>
        <Field
          label="Quantidade no frasco"
          value={vialMg}
          onChangeText={(v) => {
            setVialMg(v);
            if (parseNum(v) > 0) persist({ vialMg: parseNum(v) });
          }}
          keyboardType="decimal-pad"
          suffix="mg"
        />
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          {vials.map((v) => (
            <Chip key={v} small label={fmtMg(v)} active={mg === v} onPress={() => (setVialMg(num(v)), persist({ vialMg: v }))} />
          ))}
        </Row>
        <Field
          label="Volume do frasco"
          value={vialMl}
          onChangeText={(v) => {
            setVialMl(v);
            if (parseNum(v) > 0) persist({ vialMl: parseNum(v) });
          }}
          keyboardType="decimal-pad"
          suffix="mL"
        />
        <Row gap={space.sm}>
          {VOLUMES.map((v) => (
            <Chip key={v} small label={`${num(v)} mL`} active={ml === v} onPress={() => (setVialMl(num(v)), persist({ vialMl: v }))} />
          ))}
        </Row>
        {conc ? (
          <View style={{ alignSelf: 'center', backgroundColor: colors.bgAlt, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Txt variant="bodyStrong" style={{ fontSize: 14 }}>
              Concentração de {num(conc)} mg/mL
            </Txt>
          </View>
        ) : null}
      </Step>

      {mode === 'puxar' ? (
        <Step n={2} title="Dose prescrita">
          <Field value={dose} onChangeText={setDose} keyboardType="decimal-pad" suffix="mg" />
          <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
            {med.doses.map((x) => (
              <Chip key={x} small label={fmtMg(x)} active={d === x} onPress={() => setDose(num(x))} />
            ))}
          </Row>
        </Step>
      ) : (
        <Step n={2} title="Quanto você puxou">
          <Field value={pulled} onChangeText={setPulled} keyboardType="decimal-pad" suffix="UI" placeholder="Ex.: 8" />
        </Step>
      )}

      <Step n={3} title="Sua seringa">
        <Row gap={space.sm}>
          {SYRINGES.map((sz) => (
            <View key={sz} style={{ flex: 1 }}>
              <Chip label={`${sz} UI`} active={syringe === sz} onPress={() => (setSyringe(sz), persist({ syringeUi: sz }))} />
            </View>
          ))}
        </Row>
        <Txt variant="caption">Contas para seringa de insulina U-100 (100 UI = 1 mL). Confira no corpo da sua seringa.</Txt>
        {conc ? (
          <Row gap={6}>
            <Info size={14} color={colors.textSecondary} />
            <Txt variant="caption" color={colors.text}>
              Nesta concentração, cada 1 UI = {num(mgPerUi, 3)} mg
            </Txt>
          </Row>
        ) : null}
      </Step>

      {table.length ? (
        <>
          <Row style={{ justifyContent: 'space-between', marginTop: space.md }}>
            <Txt variant="h2">
              Tabela do seu{' '}
              <Txt variant="h2" italic>
                frasco
              </Txt>
            </Txt>
            <Button small tone="secondary" icon={Share2} label="Compartilhar" onPress={shareTable} />
          </Row>
          <Card style={{ gap: 0 }}>
            <Txt variant="bodyStrong">{medicationLabel(treatment)}</Txt>
            <Txt variant="small" color={colors.accent}>
              {num(mg)} mg / {num(ml)} mL = {num(conc)} mg/mL
            </Txt>
            <Txt variant="caption" style={{ marginBottom: space.md }}>
              Seringa de {syringe} UI · traços de {tick} UI
            </Txt>
            {table.map((r, i) => (
              <View key={r.mg}>
                {i > 0 && <Divider />}
                <Row style={{ paddingVertical: 10, justifyContent: 'space-between' }}>
                  <Txt variant="body">{num(r.mg)} mg</Txt>
                  <View style={{ flex: 1, height: 1, marginHorizontal: space.md, backgroundColor: colors.lineSoft }} />
                  <Txt variant="bodyStrong" style={{ fontSize: 20 }}>
                    {r.rounded}
                    <Txt variant="small" color={colors.accent}>
                      {' '}
                      UI
                    </Txt>
                    {Math.abs(r.exact - r.rounded) > 0.05 ? <Txt variant="caption"> ≈ {num(r.exact, 1)}</Txt> : null}
                  </Txt>
                </Row>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Row gap={space.sm} style={{ alignItems: 'flex-start' }}>
        <TriangleAlert size={16} color={colors.textSecondary} />
        <Txt variant="caption" style={{ flex: 1 }}>
          Válido só para esta concentração e seringa. Confira o rótulo do frasco e a dose prescrita.
        </Txt>
      </Row>
      <Card tone="soft">
        <Txt variant="bodyStrong">Esta é uma calculadora de volume</Txt>
        <Txt variant="small">
          Ela converte a dose que quem te acompanha prescreveu no volume correspondente da seringa, a partir dos dados do
          frasco que você informou. Ela não indica, não sugere e não ajusta dose. Em dúvida sobre o preparo ou a aplicação,
          fale com quem prescreveu antes de aplicar.
        </Txt>
      </Card>
    </StackScreen>
  );
}
