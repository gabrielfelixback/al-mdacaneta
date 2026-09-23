import { useState } from 'react';
import { View } from 'react-native';

import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Chip, Field } from '@/components/ui';
import { fmtMg } from '@/lib/calc';
import { WEEKDAYS_LONG } from '@/lib/dates';
import { getMedication, INGREDIENT_LABEL, MEDICATIONS } from '@/lib/medications';
import { dismiss } from '@/lib/nav';
import { validTime } from '@/lib/parse';
import { halfLifeLabel } from '@/lib/treatment';
import { useStore } from '@/store/useStore';
import { space } from '@/theme/tokens';

export default function TreatmentSettings() {
  const t = useStore((s) => s.treatment)!;
  const update = useStore((s) => s.updateTreatment);
  const [medId, setMedId] = useState(t.medicationId);
  const [brand, setBrand] = useState(t.brandName ?? '');
  const [dose, setDose] = useState(t.doseMg);
  const [weekday, setWeekday] = useState(t.weekday);
  const [time, setTime] = useState(t.time);
  const med = getMedication(medId);
  const valid = validTime(time) && (!med.customName || brand.trim());

  return (
    <StackScreen title="Meu tratamento">
      <Txt variant="label">Medicamento</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {MEDICATIONS.map((m) => (
          <Chip
            key={m.id}
            small
            label={m.name}
            active={medId === m.id}
            onPress={() => {
              setMedId(m.id);
              if (!m.doses.includes(dose)) setDose(m.doses[0]);
            }}
          />
        ))}
      </View>
      <Txt variant="small">
        {INGREDIENT_LABEL[med.ingredient]} · meia-vida {halfLifeLabel(medId)} · {med.frequency === 'semanal' ? 'semanal' : 'diária'}
      </Txt>
      {med.customName ? <Field label="Nome na embalagem" value={brand} onChangeText={setBrand} /> : null}
      <Txt variant="label">Dose atual</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {med.doses.map((d) => (
          <Chip key={d} small label={fmtMg(d)} active={dose === d} onPress={() => setDose(d)} />
        ))}
      </View>
      {med.frequency === 'semanal' ? (
        <>
          <Txt variant="label">Dia da aplicação</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {WEEKDAYS_LONG.map((d, i) => (
              <Chip key={d} small label={d.replace('-feira', '')} active={weekday === i} onPress={() => setWeekday(i)} />
            ))}
          </View>
        </>
      ) : null}
      <Field label="Horário" value={time} onChangeText={setTime} maxLength={5} />
      <Txt variant="caption">
        A próxima dose é calculada a partir da última aplicação registrada. Mudanças de medicamento ou dose devem seguir
        orientação médica.
      </Txt>
      <Button
        label="Salvar"
        disabled={!valid}
        onPress={() => {
          update({ medicationId: medId, brandName: med.customName ? brand.trim() : undefined, doseMg: dose, weekday, time: time.trim() });
          dismiss();
        }}
      />
    </StackScreen>
  );
}
