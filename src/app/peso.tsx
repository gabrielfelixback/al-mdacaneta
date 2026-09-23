import { useState } from 'react';

import { ModalScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Field } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { bmi, BMI_LABEL, bmiClass, fmt } from '@/lib/calc';
import { health } from '@/lib/health';
import { dismiss } from '@/lib/nav';
import { parseNum } from '@/lib/parse';
import { useStore } from '@/store/useStore';

export default function LogWeight() {
  const plan = usePlan();
  const logWeight = useStore((s) => s.logWeight);
  const sync = useStore((s) => s.settings.healthSync);
  const [kg, setKg] = useState(plan ? fmt(plan.weight) : '');
  const [waist, setWaist] = useState('');
  const w = parseNum(kg);
  const valid = w >= 30 && w <= 350;
  const diff = plan && valid ? w - plan.weight : 0;

  function save() {
    const waistCm = parseNum(waist);
    const at = new Date();
    logWeight(w, at.toISOString(), waistCm > 0 ? waistCm : undefined);
    if (sync) health.writeWeight(w, at).catch(() => {});
    dismiss();
  }

  return (
    <ModalScreen title="Registrar" italicWord="peso" footer={<Button label="Salvar" disabled={!valid} onPress={save} />}>
      <Field label="Peso de hoje" value={kg} onChangeText={setKg} keyboardType="decimal-pad" suffix="kg" autoFocus selectTextOnFocus />
      <Field label="Cintura (opcional)" value={waist} onChangeText={setWaist} keyboardType="decimal-pad" suffix="cm" />
      {plan && valid ? (
        <Card tone="soft">
          <Txt variant="small">
            IMC {fmt(bmi(w, plan.profile.heightCm))} · {BMI_LABEL[bmiClass(bmi(w, plan.profile.heightCm))]}
            {diff !== 0 ? ` · ${diff < 0 ? '−' : '+'}${fmt(Math.abs(diff))} kg desde o último registro` : ''}
          </Txt>
        </Card>
      ) : null}
      <Txt variant="caption">
        Dica: pese-se no mesmo horário, de preferência pela manhã. Oscilações de um dia para o outro são normais — olhe a
        tendência.
      </Txt>
    </ModalScreen>
  );
}
