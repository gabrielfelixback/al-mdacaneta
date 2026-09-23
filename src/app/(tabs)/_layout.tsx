import { router } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { House, Pill, Plus, UserRound, UsersRound, Utensils, type LucideIcon } from 'lucide-react-native';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/Txt';
import { tap } from '@/components/ui';
import { colors, fonts, MAX_WIDTH, radius } from '@/theme/tokens';

const TABS: { name: string; href: '/' | '/nutricao' | '/doses' | '/comunidade' | '/perfil'; label: string; icon: LucideIcon }[] = [
  { name: 'index', href: '/', label: 'Hoje', icon: House },
  { name: 'nutricao', href: '/nutricao', label: 'Nutrição', icon: Utensils },
  { name: 'doses', href: '/doses', label: 'Doses', icon: Pill },
  { name: 'comunidade', href: '/comunidade', label: 'Comunidade', icon: UsersRound },
  { name: 'perfil', href: '/perfil', label: 'Perfil', icon: UserRound },
];

type TabButtonProps = TabTriggerSlotProps & { icon: LucideIcon; label: string };

const TabButton = forwardRef<View, TabButtonProps>(function TabButton({ icon: Icon, label, isFocused, onPress, ...props }, ref) {
  return (
    <Pressable
      ref={ref}
      {...props}
      onPress={(e) => {
        tap();
        onPress?.(e);
      }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={[styles.tab, isFocused && styles.tabActive]}>
      <Icon size={20} color={isFocused ? colors.text : colors.textOnStrongMuted} strokeWidth={isFocused ? 2.1 : 1.8} />
      {isFocused ? (
        <Txt variant="caption" color={colors.text} style={{ fontFamily: fonts.sansSemi, fontSize: 12 }} numberOfLines={1}>
          {label}
        </Txt>
      ) : null}
    </Pressable>
  );
});

function Bar({ children, style: _style, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.barWrap, { bottom: Math.max(insets.bottom, 12), pointerEvents: 'box-none' }]}>
      <View {...props} style={styles.bar}>
        {children}
      </View>
      <Pressable
        accessibilityLabel="Registrar"
        accessibilityRole="button"
        onPress={() => {
          tap();
          router.push('/registrar');
        }}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}>
        <Plus size={26} color={colors.textOnStrong} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <Bar>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton icon={t.icon} label={t.label} />
            </TabTrigger>
          ))}
        </Bar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.cardStrong,
    borderRadius: radius.pill,
    padding: 6,
    gap: 2,
    flexShrink: 1,
    maxWidth: MAX_WIDTH - 80,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tab: {
    height: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabActive: { backgroundColor: colors.textOnStrong, paddingHorizontal: 14 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
