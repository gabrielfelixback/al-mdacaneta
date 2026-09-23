import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CapsuleMark } from '@/components/Brand';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, Field, IconButton, ProgressBar, Row } from '@/components/ui';
import {
  ACTIVITY_LEVEL_LABEL,
  bmi,
  BMI_LABEL,
  bmiClass,
  fmt,
  fmtInt,
  fmtMg,
  nutritionGoals,
  type ActivityLevel,
  type Sex,
} from '@/lib/calc';
import { WEEKDAYS_LONG } from '@/lib/dates';
import { getMedication, INGREDIENT_LABEL, MEDICATIONS } from '@/lib/medications';
import { parseNum, validTime } from '@/lib/parse';
import { useStore } from '@/store/useStore';
import { colors, MAX_WIDTH, space } from '@/theme/tokens';

const STEPS = 6;
const LAST_DOSE_OPTIONS = [
  { v: -1, label: 'Ainda não apliquei' },
  { v: 0, label: 'Hoje' },
  { v: 1, label: 'Ontem' },
  { v: 2, label: 'Há 2 dias' },
  { v: 3, label: 'Há 3 dias' },
  { v: 4, label: 'Há 4 dias' },
  { v: 5, label: 'Há 5 dias' },
  { v: 6, label: 'Há 6 dias' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const complete = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('f');
  const [birthYear, setBirthYear] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState<ActivityLevel>('leve');
  const [medId, setMedId] = useState(MEDICATIONS[0].id);
  const [brand, setBrand] = useState('');
  const [dose, setDose] = useState(MEDICATIONS[0].doses[0]);
  const [weekday, setWeekday] = useState(new Date().getDay());
  const [time, setTime] = useState('09:00');
  const [lastDoseDaysAgo, setLastDoseDaysAgo] = useState(-1);

  const med = getMedication(medId);
  const h = parseNum(height);
  const w = parseNum(weight);
  const g = parseNum(goal);
  const by = parseNum(birthYear);
  const age = new Date().getFullYear() - by;

  const valid = [
    true,
    name.trim().length > 0 && by > 1920 && age >= 18,
    h >= 120 && h <= 230 && w >= 35 && w <= 350 && g >= 35 && g <= w,
    true,
    validTime(time) && (!med.customName || brand.trim().length > 0),
    true,
  ][step];

  const plan = useMemo(() => {
    if (!(h > 0 && w > 0 && age > 0)) return null;
    return nutritionGoals({ sex, weightKg: w, heightCm: h, age, level });
  }, [sex, w, h, age, level]);

  function finish() {
    const now = new Date();
    let firstDose: { at: string; mg: number } | undefined;
    let startedAt = now.toISOString();
    if (lastDoseDaysAgo >= 0) {
      const d = new Date(now);
      d.setDate(d.getDate() - lastDoseDaysAgo);
      const [hh, mm] = time.split(':').map(Number);
      d.setHours(hh, mm, 0, 0);
      if (d > now) d.setTime(now.getTime());
      firstDose = { at: d.toISOString(), mg: dose };
      startedAt = d.toISOString();
    }
    complete(
      {
        name: name.trim(),
        sex,
        birthYear: by,
        heightCm: h,
        startWeightKg: w,
        goalWeightKg: g,
        activityLevel: level,
        createdAt: now.toISOString(),
      },
      {
        medicationId: medId,
        brandName: med.customName ? brand.trim() : undefined,
        doseMg: dose,
        weekday: lastDoseDaysAgo >= 0 ? new Date(firstDose!.at).getDay() : weekday,
        time: time.trim().padStart(5, '0'),
        startedAt,
      },
      firstDose,
    );
  }

  if (step === 0) {
    return (
      <View style={[styles.welcome, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}>
        <View style={{ alignItems: 'center', gap: space.xl }}>
          <CapsuleMark size={44} color={colors.textOnStrong} />
          <View style={{ alignItems: 'center' }}>
            <Txt italic style={styles.welcomeBig} color={colors.textOnStrong}>
              além
            </Txt>
            <Txt variant="title" style={{ fontSize: 44, lineHeight: 48 }} color={colors.textOnStrong}>
              da caneta
            </Txt>
          </View>
        </View>
        <View style={{ gap: space.xl, width: '100%', maxWidth: MAX_WIDTH, paddingHorizontal: space.xl }}>
          <Txt variant="h2" align="center" color={colors.textOnStrong}>
            O remédio cuida da fome.{'\n'}O resto é{' '}
            <Txt variant="h2" italic color={colors.support}>
              método.
            </Txt>
          </Txt>
          <Txt variant="small" align="center" color={colors.textOnStrongMuted}>
            Doses, proteína, água, movimento e intestino no mesmo lugar. Para chegar ao fim do tratamento com hábitos
            que ficam.
          </Txt>
          <Button label="Começar" tone="onStrong" icon={ArrowRight} onPress={() => setStep(1)} />
          <Txt variant="caption" align="center" color={colors.textOnStrongMuted}>
            Educacional. Não substitui acompanhamento médico e nutricional.
          </Txt>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: space.xl }}>
        <View style={styles.inner}>
          <Row>
            <IconButton icon={ArrowLeft} label="Voltar" onPress={() => setStep(step - 1)} />
            <View style={{ flex: 1 }}>
              <ProgressBar value={step / (STEPS - 1)} color={colors.accent} height={6} />
            </View>
            <Txt variant="caption">
              {step}/{STEPS - 1}
            </Txt>
          </Row>

          {step === 1 && (
            <>
              <Heading title="Vamos nos" italic="conhecer" sub="Usamos isso para calcular metas de energia e proteína." />
              <Field label="Como quer ser chamada(o)?" value={name} onChangeText={setName} placeholder="Seu nome" autoFocus />
              <Txt variant="label">Sexo biológico (para o cálculo metabólico)</Txt>
              <Row gap={space.sm}>
                <Chip label="Feminino" active={sex === 'f'} onPress={() => setSex('f')} />
                <Chip label="Masculino" active={sex === 'm'} onPress={() => setSex('m')} />
              </Row>
              <Field
                label="Ano de nascimento"
                value={birthYear}
                onChangeText={setBirthYear}
                keyboardType="number-pad"
                placeholder="1990"
                maxLength={4}
              />
              {by > 1920 && age < 18 ? <Txt variant="small" color={colors.danger}>O app é destinado a maiores de 18 anos.</Txt> : null}
            </>
          )}

          {step === 2 && (
            <>
              <Heading title="Seu ponto de" italic="partida" sub="Peso e altura para IMC e metas. Só você vê esses números." />
              <Field label="Altura" value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="165" suffix="cm" />
              <Field label="Peso atual" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="80,0" suffix="kg" />
              <Field label="Meta de peso" value={goal} onChangeText={setGoal} keyboardType="decimal-pad" placeholder="70,0" suffix="kg" />
              {h > 0 && w > 0 ? (
                <Card tone="soft">
                  <Txt variant="small">
                    IMC atual:{' '}
                    <Txt variant="bodyStrong">
                      {fmt(bmi(w, h))} · {BMI_LABEL[bmiClass(bmi(w, h))]}
                    </Txt>
                  </Txt>
                </Card>
              ) : null}
              {g > w ? <Txt variant="small" color={colors.danger}>A meta precisa ser menor ou igual ao peso atual.</Txt> : null}
            </>
          )}

          {step === 3 && (
            <>
              <Heading title="Sua rotina de" italic="movimento" sub="Fora os treinos que você vai registrar, como é o seu dia a dia?" />
              {(Object.keys(ACTIVITY_LEVEL_LABEL) as ActivityLevel[]).map((l) => (
                <Card key={l} tone={level === l ? 'strong' : 'default'} onPress={() => setLevel(l)} style={{ paddingVertical: space.lg }}>
                  <Txt variant="bodyStrong" color={level === l ? colors.textOnStrong : colors.text}>
                    {ACTIVITY_LEVEL_LABEL[l]}
                  </Txt>
                  <Txt variant="small" color={level === l ? colors.textOnStrongMuted : colors.textSecondary}>
                    {
                      {
                        sedentario: 'Trabalho sentada(o), pouco deslocamento a pé',
                        leve: 'Caminho um pouco no dia, alguma atividade leve',
                        moderado: 'Em pé boa parte do dia ou exercício 3–5x/semana',
                        intenso: 'Trabalho físico ou treino quase todo dia',
                      }[l]
                    }
                  </Txt>
                </Card>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <Heading title="Seu" italic="tratamento" sub="Qual medicamento você usa? Você pode mudar isso depois." />
              <View style={styles.wrap}>
                {MEDICATIONS.map((m) => (
                  <Chip
                    key={m.id}
                    label={m.name}
                    active={medId === m.id}
                    onPress={() => {
                      setMedId(m.id);
                      setDose(m.doses[0]);
                    }}
                  />
                ))}
              </View>
              <Txt variant="small">
                {INGREDIENT_LABEL[med.ingredient]} · aplicação {med.frequency === 'semanal' ? 'semanal' : 'diária'}
              </Txt>
              {med.customName ? (
                <Field label="Nome na embalagem" value={brand} onChangeText={setBrand} placeholder="Ex.: nome comercial ou da farmácia" />
              ) : null}
              <Txt variant="label">Dose atual</Txt>
              <View style={styles.wrap}>
                {med.doses.map((d) => (
                  <Chip key={d} label={fmtMg(d)} active={dose === d} onPress={() => setDose(d)} />
                ))}
              </View>
              <Txt variant="label">Última aplicação</Txt>
              <View style={styles.wrap}>
                {LAST_DOSE_OPTIONS.map((o) => (
                  <Chip key={o.v} small label={o.label} active={lastDoseDaysAgo === o.v} onPress={() => setLastDoseDaysAgo(o.v)} />
                ))}
              </View>
              {lastDoseDaysAgo < 0 && med.frequency === 'semanal' ? (
                <>
                  <Txt variant="label">Dia da aplicação</Txt>
                  <View style={styles.wrap}>
                    {WEEKDAYS_LONG.map((d, i) => (
                      <Chip key={d} small label={d.replace('-feira', '')} active={weekday === i} onPress={() => setWeekday(i)} />
                    ))}
                  </View>
                </>
              ) : null}
              <Field label="Horário habitual" value={time} onChangeText={setTime} placeholder="09:00" maxLength={5} />
            </>
          )}

          {step === 5 && plan && (
            <>
              <Heading title="Seu plano" italic="diário" sub="Pontos de partida calculados a partir dos seus dados. Ajuste com seu nutricionista." />
              <Card tone="strong" style={{ gap: space.lg }}>
                <Txt variant="label" color={colors.textOnStrongMuted}>
                  P1 · Proteína primeiro
                </Txt>
                <Txt variant="display" color={colors.textOnStrong}>
                  {plan.protein} g
                </Txt>
                <Txt variant="small" color={colors.textOnStrongMuted}>
                  de proteína por dia para proteger a massa magra enquanto o corpo muda.
                </Txt>
              </Card>
              <Row gap={space.md} style={{ alignItems: 'stretch' }}>
                <PlanTile label="Energia" value={fmtInt(plan.kcal)} unit="kcal" />
                <PlanTile label="Água" value={fmt(plan.waterMl / 1000)} unit="L" />
                <PlanTile label="Fibras" value={String(plan.fiber)} unit="g" />
              </Row>
              <Txt variant="caption">
                Energia: Mifflin-St Jeor × nível de atividade − 500 kcal, com piso de segurança. Proteína: 1,5 g/kg (peso
                ajustado quando IMC ≥ 30). Água: 35 ml/kg.
              </Txt>
            </>
          )}
        </View>
      </ScrollView>
      <View style={[styles.inner, { paddingBottom: insets.bottom + space.lg }]}>
        <Button
          label={step === STEPS - 1 ? 'Entrar no app' : 'Continuar'}
          icon={step === STEPS - 1 ? undefined : ArrowRight}
          disabled={!valid}
          onPress={() => (step === STEPS - 1 ? finish() : setStep(step + 1))}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Heading({ title, italic, sub }: { title: string; italic: string; sub: string }) {
  return (
    <View style={{ gap: space.sm, marginTop: space.lg, marginBottom: space.sm }}>
      <Txt variant="title">
        {title}{' '}
        <Txt variant="title" italic>
          {italic}
        </Txt>
      </Txt>
      <Txt variant="small">{sub}</Txt>
    </View>
  );
}

function PlanTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card style={{ flex: 1, padding: space.lg, gap: 4 }}>
      <Txt variant="label">{label}</Txt>
      <Txt variant="number" style={{ fontSize: 22 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        <Txt variant="small"> {unit}</Txt>
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  welcome: { flex: 1, backgroundColor: colors.cardStrong, alignItems: 'center', justifyContent: 'space-between' },
  welcomeBig: { fontSize: 96, lineHeight: 100 },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
