import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ModalScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, Field, Row } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { ACTIVITY_TYPES, activityKcal, getActivityType, INTENSITY_HINT, INTENSITY_LABEL, type Intensity } from '@/lib/activities';
import { fmt } from '@/lib/calc';
import { dayKey } from '@/lib/dates';
import { dismiss } from '@/lib/nav';
import { parseNum } from '@/lib/parse';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

const DURATIONS = [15, 30, 45, 60, 90];

export default function LogActivity() {
  const { day } = useLocalSearchParams<{ day?: string }>();
  const plan = usePlan();
  const addActivity = useStore((s) => s.addActivity);
  const [typeId, setTypeId] = useState('caminhada');
  const [intensity, setIntensity] = useState<Intensity>('moderado');
  const [minutes, setMinutes] = useState('30');
  const min = parseNum(minutes);
  const valid = min > 0 && min <= 600;
  const weight = plan?.weight ?? 70;
  const kcal = valid ? activityKcal(typeId, intensity, min, weight) : 0;
  const met = getActivityType(typeId).met[intensity];

  return (
    <ModalScreen
      title="Registrar"
      italicWord="movimento"
      footer={
        <Button
          label={valid ? `Salvar · ${kcal} kcal` : 'Salvar'}
          disabled={!valid}
          onPress={() => {
            addActivity({ day: day ?? dayKey(), typeId, intensity, minutes: min });
            dismiss();
          }}
        />
      }>
      <Txt variant="label">Tipo</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {ACTIVITY_TYPES.map((a) => (
          <Chip key={a.id} small label={a.label} active={typeId === a.id} onPress={() => setTypeId(a.id)} />
        ))}
      </View>

      <Txt variant="label">Intensidade</Txt>
      <Row gap={space.sm}>
        {(['leve', 'moderado', 'intenso'] as Intensity[]).map((i) => (
          <Card
            key={i}
            tone={intensity === i ? 'strong' : 'default'}
            onPress={() => setIntensity(i)}
            style={{ flex: 1, padding: space.md, gap: 4 }}>
            <Txt variant="bodyStrong" color={intensity === i ? colors.textOnStrong : colors.text}>
              {INTENSITY_LABEL[i]}
            </Txt>
            <Txt variant="caption" color={intensity === i ? colors.textOnStrongMuted : colors.textMuted}>
              {INTENSITY_HINT[i]}
            </Txt>
          </Card>
        ))}
      </Row>

      <Txt variant="label">Duração</Txt>
      <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
        {DURATIONS.map((d) => (
          <Chip key={d} small label={`${d} min`} active={minutes === String(d)} onPress={() => setMinutes(String(d))} />
        ))}
      </Row>
      <Field value={minutes} onChangeText={setMinutes} keyboardType="number-pad" suffix="min" />

      <Card tone="soft">
        <Txt variant="label">Gasto estimado</Txt>
        <Txt variant="display">
          {kcal}
          <Txt variant="h2"> kcal</Txt>
        </Txt>
        <Txt variant="caption">
          MET {fmt(met)} × {fmt(weight)} kg × {fmt(valid ? min / 60 : 0, 2)} h · Compendium of Physical Activities
        </Txt>
      </Card>
    </ModalScreen>
  );
}
