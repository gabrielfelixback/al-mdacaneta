import { router } from 'expo-router';
import { Flame, Settings } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { streak, useStore } from '@/store/useStore';
import { colors, fonts, radius } from '@/theme/tokens';
import { Txt } from './Txt';
import { IconButton } from './ui';

export function HeaderActions() {
  const n = useStore(streak);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable
        accessibilityLabel={`${n} dias seguidos com registro`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: n > 0 ? colors.accent : colors.bgAlt,
        }}>
        <Flame size={16} color={n > 0 ? colors.textOnStrong : colors.textSecondary} strokeWidth={2} />
        <Txt variant="bodyStrong" color={n > 0 ? colors.textOnStrong : colors.textSecondary} style={{ fontFamily: fonts.sansBold }}>
          {n}
        </Txt>
      </Pressable>
      <IconButton icon={Settings} label="Configurações" onPress={() => router.push('/configuracoes')} />
    </View>
  );
}
