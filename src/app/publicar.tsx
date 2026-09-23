import { useState } from 'react';
import { View } from 'react-native';

import { ModalScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Chip, Field } from '@/components/ui';
import { dismiss } from '@/lib/nav';
import { COMMUNITY_TAGS } from '@/store/seed';
import { useStore } from '@/store/useStore';
import { space } from '@/theme/tokens';

export default function NewPost() {
  const addPost = useStore((s) => s.addPost);
  const [body, setBody] = useState('');
  const [tag, setTag] = useState<string | undefined>();
  const ok = body.trim().length >= 10;

  return (
    <ModalScreen
      title="Nova"
      italicWord="publicação"
      footer={
        <Button
          label="Publicar"
          disabled={!ok}
          onPress={() => {
            addPost(body.trim(), tag);
            dismiss();
          }}
        />
      }>
      <Field
        multiline
        autoFocus
        value={body}
        onChangeText={setBody}
        placeholder="Conte como está sendo sua semana, uma dúvida ou algo que funcionou para você."
        maxLength={1200}
      />
      <Txt variant="label">Tema</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {COMMUNITY_TAGS.map((t) => (
          <Chip key={t} small label={t} active={tag === t} onPress={() => setTag(tag === t ? undefined : t)} />
        ))}
      </View>
      <Txt variant="caption">
        Evite expor dados pessoais. Publicações com venda de medicamentos ou orientação de dose são removidas.
      </Txt>
    </ModalScreen>
  );
}
