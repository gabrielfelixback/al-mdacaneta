import { router } from 'expo-router';
import { ChevronRight, Lock } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { BookCover } from '@/components/Brand';
import { Txt } from '@/components/Txt';
import { Row, tap } from '@/components/ui';
import { LIBRARY } from '@/lib/library';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme/tokens';

export function LibraryRail() {
  const pro = useStore((s) => s.pro.active);
  return (
    <View style={{ gap: space.md }}>
      <Pressable onPress={() => router.push('/biblioteca')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="h2">
            Biblioteca do{' '}
            <Txt variant="h2" italic>
              método
            </Txt>
          </Txt>
          <Row gap={4}>
            {!pro ? (
              <View style={{ backgroundColor: colors.cardStrong, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Txt variant="caption" color={colors.textOnStrong} style={{ fontSize: 10 }}>
                  PRO
                </Txt>
              </View>
            ) : null}
            <ChevronRight size={18} color={colors.textMuted} />
          </Row>
        </Row>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingRight: space.lg }} style={{ marginRight: -space.lg }}>
        {LIBRARY.map((it) => (
          <Pressable
            key={it.id}
            onPress={() => {
              tap();
              router.push(pro ? { pathname: '/biblioteca', params: { open: it.id } } : '/pro');
            }}
            style={({ pressed }) => ({ width: 124, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
            <BookCover small title={it.title} italic={it.italic} tone={it.tone} tag={it.tag} />
            {!pro ? (
              <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(23,51,43,0.75)', borderRadius: 12, padding: 5 }}>
                <Lock size={12} color={colors.textOnStrong} />
              </View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
