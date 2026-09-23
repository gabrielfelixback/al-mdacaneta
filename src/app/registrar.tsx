import { router, type Href } from 'expo-router';
import { Activity, Camera, Droplet, Frown, LineChart, Pill, Utensils, X, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/Txt';
import { IconButton, tap } from '@/components/ui';
import { dayKey } from '@/lib/dates';
import { health } from '@/lib/health';
import { useStore } from '@/store/useStore';
import { colors, MAX_WIDTH, radius, space } from '@/theme/tokens';

export default function QuickAdd() {
  const insets = useSafeAreaInsets();
  const cup = useStore((s) => s.settings.cupMl);
  const sync = useStore((s) => s.settings.healthSync);

  const go = (href: Href) => {
    router.back();
    setTimeout(() => router.push(href), 60);
  };

  const actions: { label: string; icon: LucideIcon; strong?: boolean; onPress: () => void }[] = [
    { label: 'Foto do prato', icon: Camera, strong: true, onPress: () => go({ pathname: '/refeicao', params: { mode: 'foto' } }) },
    { label: 'Refeição', icon: Utensils, onPress: () => go('/refeicao') },
    { label: 'Aplicação', icon: Pill, onPress: () => go('/aplicacao') },
    { label: 'Peso', icon: LineChart, onPress: () => go('/peso') },
    {
      label: `+${cup} ml de água`,
      icon: Droplet,
      onPress: () => {
        const s = useStore.getState();
        const k = dayKey();
        s.setWater(k, (s.water[k] ?? 0) + cup);
        if (sync) health.writeWater(cup, new Date()).catch(() => {});
        router.back();
      },
    },
    { label: 'Atividade', icon: Activity, onPress: () => go('/atividade') },
    { label: 'Efeito colateral', icon: Frown, onPress: () => go('/efeito') },
  ];

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} accessibilityLabel="Fechar" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.head}>
          <Txt variant="h2" color={colors.textOnStrong}>
            Registrar{' '}
            <Txt variant="h2" italic color={colors.support}>
              agora
            </Txt>
          </Txt>
          <IconButton icon={X} tone="onStrong" label="Fechar" onPress={() => router.back()} />
        </View>
        <View style={styles.grid}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => {
                tap();
                a.onPress();
              }}
              style={({ pressed }) => [
                styles.item,
                a.strong && { backgroundColor: colors.accent, flexBasis: '100%' },
                pressed && { opacity: 0.8 },
              ]}>
              <a.icon size={22} color={colors.textOnStrong} strokeWidth={1.8} />
              <Txt variant="bodyStrong" color={colors.textOnStrong}>
                {a.label}
              </Txt>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23,51,43,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cardStrong,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    gap: space.lg,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  item: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.trackOnStrong,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
  },
});
