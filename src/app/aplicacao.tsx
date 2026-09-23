import { useState } from 'react';
import { View } from 'react-native';

import { ModalScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, Field } from '@/components/ui';
import { fmtMg } from '@/lib/calc';
import { getMedication, INJECTION_SITES, nextSite } from '@/lib/medications';
import { dismiss } from '@/lib/nav';
import { medicationLabel } from '@/lib/treatment';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

const WHEN = [
  { v: 0, label: 'Agora' },
  { v: 1, label: 'Ontem' },
  { v: 2, label: 'Há 2 dias' },
];

export default function LogDose() {
  const treatment = useStore((s) => s.treatment)!;
  const doses = useStore((s) => s.doses);
  const logDose = useStore((s) => s.logDose);
  const updateTreatment = useStore((s) => s.updateTreatment);
  const med = getMedication(treatment.medicationId);
  const [mg, setMg] = useState(treatment.doseMg);
  const [site, setSite] = useState<string>(nextSite(doses[0]?.site));
  const [when, setWhen] = useState(0);
  const [note, setNote] = useState('');

  function save() {
    const at = new Date();
    at.setDate(at.getDate() - when);
    logDose({ at: at.toISOString(), mg, medicationId: treatment.medicationId, site, note: note.trim() || undefined });
    if (mg !== treatment.doseMg) updateTreatment({ doseMg: mg });
    dismiss();
  }

  return (
    <ModalScreen title="Registrar" italicWord="aplicação" footer={<Button label="Salvar aplicação" onPress={save} />}>
      <Card tone="soft">
        <Txt variant="bodyStrong">{medicationLabel(treatment)}</Txt>
        <Txt variant="small">Dose atual no plano: {fmtMg(treatment.doseMg)}</Txt>
      </Card>

      <Txt variant="label">Dose aplicada</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {med.doses.map((d) => (
          <Chip key={d} label={fmtMg(d)} active={mg === d} onPress={() => setMg(d)} />
        ))}
      </View>
      {mg !== treatment.doseMg ? (
        <Txt variant="caption" color={colors.accent}>
          A dose do plano será atualizada para {fmtMg(mg)}. Mudanças de dose devem seguir orientação médica.
        </Txt>
      ) : null}

      <Txt variant="label">Quando</Txt>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {WHEN.map((w) => (
          <Chip key={w.v} small label={w.label} active={when === w.v} onPress={() => setWhen(w.v)} />
        ))}
      </View>

      <Txt variant="label">Local</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {INJECTION_SITES.map((s) => (
          <Chip key={s.id} small label={s.label} active={site === s.id} onPress={() => setSite(s.id)} />
        ))}
      </View>

      <Field label="Observação (opcional)" value={note} onChangeText={setNote} placeholder="Ex.: apliquei após o jantar" />
    </ModalScreen>
  );
}
