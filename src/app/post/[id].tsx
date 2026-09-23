import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, PostCard } from '@/components/PostCard';
import { StackScreen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Field, IconButton, Row } from '@/components/ui';
import { relativeTime } from '@/lib/dates';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = useStore((s) => s.posts.find((p) => p.id === id));
  const addComment = useStore((s) => s.addComment);
  const [text, setText] = useState('');

  if (!post) {
    return (
      <StackScreen title="Publicação">
        <Txt variant="small">Publicação não encontrada.</Txt>
      </StackScreen>
    );
  }

  function send() {
    if (!text.trim()) return;
    addComment(post!.id, text.trim());
    setText('');
  }

  return (
    <StackScreen title="Publicação">
      <PostCard post={post} full />
      <Txt variant="label" style={{ marginTop: space.sm }}>
        {post.comments.length} {post.comments.length === 1 ? 'comentário' : 'comentários'}
      </Txt>
      {post.comments.map((c) => (
        <Row key={c.id} style={{ alignItems: 'flex-start' }}>
          <Avatar name={c.author} size={32} />
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, gap: 2 }}>
            <Txt variant="bodyStrong" style={{ fontSize: 14 }}>
              {c.author} <Txt variant="caption">· {relativeTime(c.at)}</Txt>
            </Txt>
            <Txt variant="small" color={colors.text}>
              {c.body}
            </Txt>
          </View>
        </Row>
      ))}
      <Row style={{ alignItems: 'flex-end' }}>
        <Field style={{ flex: 1 }} value={text} onChangeText={setText} placeholder="Escreva um comentário acolhedor" onSubmitEditing={send} />
        <IconButton icon={Send} tone="strong" size={50} label="Enviar comentário" onPress={send} />
      </Row>
    </StackScreen>
  );
}
