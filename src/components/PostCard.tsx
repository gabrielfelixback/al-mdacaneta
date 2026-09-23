import { router } from 'expo-router';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { relativeTime } from '@/lib/dates';
import { useStore } from '@/store/useStore';
import type { Post } from '@/store/types';
import { colors, fonts, radius, space } from '@/theme/tokens';
import { Txt } from './Txt';
import { Card, Row, tap } from './ui';

const AVATAR_TONES = [colors.cardStrong, colors.textSecondary, colors.accent, '#7D9CA8', '#8A7D5C'];

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const tone = AVATAR_TONES[name.charCodeAt(0) % AVATAR_TONES.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone, alignItems: 'center', justifyContent: 'center' }}>
      <Txt variant="h3" color={colors.textOnStrong} style={{ fontSize: size * 0.42 }}>
        {name.trim().charAt(0).toUpperCase()}
      </Txt>
    </View>
  );
}

export function PostCard({ post, full }: { post: Post; full?: boolean }) {
  const toggleLike = useStore((s) => s.toggleLike);
  return (
    <Card onPress={full ? undefined : () => router.push({ pathname: '/post/[id]', params: { id: post.id } })}>
      <Row>
        <Avatar name={post.author} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">
            {post.author}
            {post.mine ? <Txt variant="caption"> · você</Txt> : null}
          </Txt>
          <Txt variant="caption">{relativeTime(post.at)}</Txt>
        </View>
        {post.tag ? (
          <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Txt variant="caption" color={colors.text}>
              {post.tag}
            </Txt>
          </View>
        ) : null}
      </Row>
      <Txt variant="body" numberOfLines={full ? undefined : 5}>
        {post.body}
      </Txt>
      <Row gap={space.xl}>
        <Pressable
          accessibilityLabel={post.liked ? 'Descurtir' : 'Curtir'}
          hitSlop={8}
          onPress={() => {
            tap();
            toggleLike(post.id);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Heart size={19} color={post.liked ? colors.accent : colors.textSecondary} fill={post.liked ? colors.accent : 'transparent'} />
          <Txt variant="small" style={{ fontFamily: fonts.sansMedium }}>
            {post.likes}
          </Txt>
        </Pressable>
        <Row gap={6}>
          <MessageCircle size={19} color={colors.textSecondary} />
          <Txt variant="small" style={{ fontFamily: fonts.sansMedium }}>
            {post.comments.length}
          </Txt>
        </Row>
      </Row>
    </Card>
  );
}
