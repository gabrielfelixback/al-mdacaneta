import { useState } from 'react';
import { View } from 'react-native';

import { ModalScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, Field, Row } from '@/components/ui';
import { SIDE_EFFECTS } from '@/lib/medications';
import { dismiss } from '@/lib/nav';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme/tokens';

const SEVERITY = [
  { v: 1 as const, label: 'Leve' },
  { v: 2 as const, label: 'Moderado' },
  { v: 3 as const, label: 'Forte' },
];

export default function LogSideEffect() {
  const add = useStore((s) => s.addSideEffect);
  const [kinds, setKinds] = useState<string[]>([]);
  const [severity, setSeverity] = useState<1 | 2 | 3>(1);
  const [note, setNote] = useState('');

  const toggle = (k: string) => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k]);

  function save() {
    const at = new Date().toISOString();
    kinds.forEach((kind) => add({ at, kind, severity, note: note.trim() || undefined }));
    dismiss();
  }

  return (
    <ModalScreen
      title="Efeito"
      italicWord="colateral"
      footer={<Button label="Salvar" disabled={kinds.length === 0} onPress={save} />}>
      <Txt variant="label">O que você sentiu?</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {SIDE_EFFECTS.map((k) => (
          <Chip key={k} small label={k} active={kinds.includes(k)} onPress={() => toggle(k)} />
        ))}
      </View>
      <Txt variant="label">Intensidade</Txt>
      <Row gap={space.sm}>
        {SEVERITY.map((s) => (
          <Chip key={s.v} label={s.label} active={severity === s.v} onPress={() => setSeverity(s.v)} />
        ))}
      </Row>
      <Field label="Observação (opcional)" value={note} onChangeText={setNote} multiline placeholder="Quando começou, o que ajudou…" />
      {severity === 3 ? (
        <Card tone="soft">
          <Txt variant="small" color={colors.danger}>
            Dor abdominal forte e persistente, vômitos que não passam, sinais de desidratação ou reação alérgica: procure
            atendimento médico.
          </Txt>
        </Card>
      ) : null}
    </ModalScreen>
  );
}
