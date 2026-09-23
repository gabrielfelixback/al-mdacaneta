import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { BookCover } from '@/components/Brand';
import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Row, tap } from '@/components/ui';
import { daysUntilUnlock, LIBRARY, type LibraryItem } from '@/lib/library';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

export default function Library() {
  const params = useLocalSearchParams<{ open?: string }>();
  const pro = useStore((s) => s.pro);
  const [selected, setSelected] = useState<LibraryItem | null>(() => LIBRARY.find((i) => i.id === params.open) ?? null);

  function open(item: LibraryItem) {
    tap();
    if (!pro.active) return router.push('/pro');
    setSelected(item);
  }

  const wait = selected ? daysUntilUnlock(selected, pro.since) : 0;

  return (
    <StackScreen title="Biblioteca">
      <Txt variant="small">
        Os materiais do Método 3P, organizados pelos três passos: <Txt variant="bodyStrong">P1</Txt> priorizar proteína,{' '}
        <Txt variant="bodyStrong">P2</Txt> planejar refeições pequenas e <Txt variant="bodyStrong">P3</Txt> preparar a
        transição.
      </Txt>

      {!pro.active ? (
        <Card tone="strong" style={{ gap: space.md }}>
          <Txt variant="h2" color={colors.textOnStrong}>
            Disponível no{' '}
            <Txt variant="h2" italic color={colors.support}>
              Pro
            </Txt>
          </Txt>
          <Txt variant="small" color={colors.textOnStrongMuted}>
            Assine ou resgate o código que você recebeu ao comprar o Método 3P.
          </Txt>
          <Button tone="onStrong" label="Conhecer o Pro" onPress={() => router.push('/pro')} />
        </Card>
      ) : null}

      {selected ? (
        <Card style={{ gap: space.md }}>
          <Row style={{ alignItems: 'flex-start' }} gap={space.lg}>
            <View style={{ width: 96 }}>
              <BookCover small title={selected.title} italic={selected.italic} tone={selected.tone} tag={selected.tag} />
            </View>
            <View style={{ flex: 1, gap: space.sm }}>
              <Txt variant="label" color={colors.accent}>
                {selected.tag}
              </Txt>
              <Txt variant="h2">
                {selected.title}{' '}
                <Txt variant="h2" italic>
                  {selected.italic}
                </Txt>
              </Txt>
              <Txt variant="small">{selected.subtitle}</Txt>
            </View>
          </Row>
          {wait > 0 ? (
            <Row gap={space.sm}>
              <Clock size={16} color={colors.textSecondary} />
              <Txt variant="small">
                Libera em {wait} {wait === 1 ? 'dia' : 'dias'}. Primeiro, a rotina; depois, a saída.
              </Txt>
            </Row>
          ) : selected.url ? (
            <Button label="Abrir PDF" onPress={() => WebBrowser.openBrowserAsync(selected.url!).catch(() => {})} />
          ) : (
            <Txt variant="small" color={colors.accent}>
              PDF em preparação — chega aqui em breve.
            </Txt>
          )}
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {LIBRARY.map((it) => {
          const locked = !pro.active || daysUntilUnlock(it, pro.since) > 0;
          return (
            <Pressable
              key={it.id}
              onPress={() => open(it)}
              style={({ pressed }) => ({ width: '47.5%', gap: space.sm, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
              <View>
                <BookCover title={it.title} italic={it.italic} tone={it.tone} tag={it.tag} />
                {locked ? (
                  <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(23,51,43,0.75)', borderRadius: radius.pill, padding: 6 }}>
                    <Lock size={13} color={colors.textOnStrong} />
                  </View>
                ) : null}
              </View>
              <Txt variant="caption" numberOfLines={2}>
                {it.subtitle}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </StackScreen>
  );
}
