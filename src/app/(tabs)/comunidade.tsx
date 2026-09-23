import { router } from 'expo-router';
import { PenLine, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { PostCard } from '@/components/PostCard';
import { TabScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Button, Card, Chip, ProgressBar, Row, Segmented, tap } from '@/components/ui';
import { relativeTime } from '@/lib/dates';
import { COMMUNITY_TAGS } from '@/store/seed';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, space } from '@/theme/tokens';

type Tab = 'posts' | 'polls';

export default function Community() {
  const [tab, setTab] = useState<Tab>('posts');
  const [filter, setFilter] = useState<string>('todos');
  const posts = useStore((s) => s.posts);
  const polls = useStore((s) => s.polls);
  const vote = useStore((s) => s.votePoll);
  const pendingPolls = polls.filter((p) => !p.voted).length;

  const visible = posts.filter((p) =>
    filter === 'todos' ? true : filter === 'minhas' ? p.mine : p.tag === filter,
  );

  return (
    <TabScreen
      title="Comunidade"
      subtitle={
        <Txt variant="small" style={{ marginTop: 4 }}>
          Quem usa a caneta, contando como é de verdade.
        </Txt>
      }>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'posts', label: 'Postagens' },
          { value: 'polls', label: pendingPolls ? `Enquetes · ${pendingPolls}` : 'Enquetes' },
        ]}
      />

      {tab === 'posts' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            <Chip small label="Todos" active={filter === 'todos'} onPress={() => setFilter('todos')} />
            <Chip small label="Minhas" active={filter === 'minhas'} onPress={() => setFilter('minhas')} />
            {COMMUNITY_TAGS.map((t) => (
              <Chip key={t} small label={t} active={filter === t} onPress={() => setFilter(t)} />
            ))}
          </ScrollView>

          <Button label="Criar publicação" icon={PenLine} onPress={() => router.push('/publicar')} />

          <Card tone="soft" style={{ gap: space.sm, padding: space.lg }}>
            <Row gap={space.sm}>
              <ShieldCheck size={16} color={colors.textSecondary} />
              <Txt variant="label">Combinados da comunidade</Txt>
            </Row>
            <Txt variant="caption" color={colors.textSecondary}>
              Troca de experiências, não prescrição. Sem venda ou indicação de medicamentos, sem ajuste de dose por aqui e
              sem julgamento de corpo. Dúvida clínica é com seu médico.
            </Txt>
          </Card>

          {visible.length === 0 ? (
            <Txt variant="small" align="center" style={{ marginTop: space.xl }}>
              Nenhuma publicação por aqui ainda.
            </Txt>
          ) : (
            visible.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </>
      ) : (
        polls.map((q) => {
          const total = q.options.reduce((t, o) => t + o.votes, 0);
          return (
            <Card key={q.id}>
              <Txt variant="caption">{relativeTime(q.at)}</Txt>
              <Txt variant="h2">{q.question}</Txt>
              <View style={{ gap: space.sm }}>
                {q.options.map((o) => {
                  const pct = total ? o.votes / total : 0;
                  const mine = q.voted === o.id;
                  return q.voted ? (
                    <View key={o.id} style={{ gap: 4 }}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Txt variant="small" color={colors.text} style={{ fontFamily: mine ? fonts.sansSemi : fonts.sans }}>
                          {o.label}
                          {mine ? ' · seu voto' : ''}
                        </Txt>
                        <Txt variant="small" color={colors.text}>
                          {Math.round(pct * 100)}%
                        </Txt>
                      </Row>
                      <ProgressBar value={pct} color={mine ? colors.accent : colors.cardStrong} height={8} />
                    </View>
                  ) : (
                    <Pressable
                      key={o.id}
                      onPress={() => {
                        tap();
                        vote(q.id, o.id);
                      }}
                      style={({ pressed }) => ({
                        borderWidth: 1.5,
                        borderColor: colors.line,
                        borderRadius: radius.md,
                        paddingVertical: 12,
                        paddingHorizontal: space.lg,
                        backgroundColor: pressed ? colors.bgAlt : colors.card,
                      })}>
                      <Txt variant="bodyStrong">{o.label}</Txt>
                    </Pressable>
                  );
                })}
              </View>
              <Txt variant="caption">{total.toLocaleString('pt-BR')} votos</Txt>
            </Card>
          );
        })
      )}
    </TabScreen>
  );
}
