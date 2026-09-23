import { useState } from 'react';
import { View } from 'react-native';

import { requireSetup } from '@/components/RequireSetup';
import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, Field, Row } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { ACTIVITY_LEVEL_LABEL, fmt, fmtInt, type ActivityLevel, type Sex } from '@/lib/calc';
import { dismiss } from '@/lib/nav';
import { heightCm, parseNum } from '@/lib/parse';
import { useStore } from '@/store/useStore';
import { space } from '@/theme/tokens';

function MyData() {
  const profile = useStore((s) => s.profile)!;
  const update = useStore((s) => s.updateProfile);
  const plan = usePlan();
  const [name, setName] = useState(profile.name);
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [birthYear, setBirthYear] = useState(String(profile.birthYear));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [goal, setGoal] = useState(fmt(profile.goalWeightKg));
  const [start, setStart] = useState(fmt(profile.startWeightKg));
  const [level, setLevel] = useState<ActivityLevel>(profile.activityLevel);

  const h = heightCm(height);
  const g = parseNum(goal);
  const st = parseNum(start);
  const by = parseNum(birthYear);
  const valid = name.trim() && h >= 120 && h <= 230 && g >= 35 && st >= 35 && by > 1920;

  return (
    <StackScreen title="Meus dados">
      <Field label="Nome" value={name} onChangeText={setName} />
      <Row gap={space.sm}>
        <Chip label="Feminino" active={sex === 'f'} onPress={() => setSex('f')} />
        <Chip label="Masculino" active={sex === 'm'} onPress={() => setSex('m')} />
      </Row>
      <Row gap={space.sm}>
        <Field style={{ flex: 1 }} label="Ano de nascimento" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" maxLength={4} />
        <Field style={{ flex: 1 }} label="Altura" value={height} onChangeText={setHeight} keyboardType="decimal-pad" suffix="cm" />
      </Row>
      <Row gap={space.sm}>
        <Field style={{ flex: 1 }} label="Peso inicial" value={start} onChangeText={setStart} keyboardType="decimal-pad" suffix="kg" />
        <Field style={{ flex: 1 }} label="Meta" value={goal} onChangeText={setGoal} keyboardType="decimal-pad" suffix="kg" />
      </Row>
      <Txt variant="label">Nível de atividade no dia a dia</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {(Object.keys(ACTIVITY_LEVEL_LABEL) as ActivityLevel[]).map((l) => (
          <Chip key={l} small label={ACTIVITY_LEVEL_LABEL[l]} active={level === l} onPress={() => setLevel(l)} />
        ))}
      </View>
      {plan ? (
        <Card tone="soft">
          <Txt variant="label">Metas atuais</Txt>
          <Txt variant="small">
            {fmtInt(plan.goals.kcal)} kcal · {plan.goals.protein} g proteína · {fmt(plan.goals.waterMl / 1000)} L de água ·{' '}
            {plan.goals.fiber} g fibras · basal {fmtInt(plan.bmr)} kcal
          </Txt>
        </Card>
      ) : null}
      <Button
        label="Salvar"
        disabled={!valid}
        onPress={() => {
          update({ name: name.trim(), sex, birthYear: by, heightCm: h, goalWeightKg: g, startWeightKg: st, activityLevel: level });
          dismiss();
        }}
      />
    </StackScreen>
  );
}

export default requireSetup(MyData);
