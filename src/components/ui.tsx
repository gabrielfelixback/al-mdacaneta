import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, space } from '@/theme/tokens';
import { Txt } from './Txt';

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

// ---------- Card ----------

type CardTone = 'default' | 'strong' | 'soft' | 'outline';

export function Card({
  tone = 'default',
  style,
  children,
  onPress,
}: {
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  onPress?: () => void;
}) {
  const s = [styles.card, cardTone[tone], style];
  if (!onPress) return <View style={s}>{children}</View>;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s, pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] }]}>
      {children}
    </Pressable>
  );
}

const cardTone = StyleSheet.create({
  default: { backgroundColor: colors.card },
  strong: { backgroundColor: colors.cardStrong },
  soft: { backgroundColor: colors.bgAlt },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
});

// ---------- Cabeçalho de card ----------

export function CardHeader({
  icon: Icon,
  title,
  right,
  onStrong,
}: {
  icon?: LucideIcon;
  title: string;
  right?: ReactNode;
  onStrong?: boolean;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        {Icon ? <Icon size={18} color={onStrong ? colors.support : colors.textSecondary} strokeWidth={1.8} /> : null}
        <Txt variant="label" color={onStrong ? colors.textOnStrongMuted : colors.textSecondary}>
          {title}
        </Txt>
      </View>
      {right}
    </View>
  );
}

// ---------- Botões ----------

type ButtonTone = 'primary' | 'secondary' | 'accent' | 'ghost' | 'onStrong';

export function Button({
  label,
  icon: Icon,
  tone = 'primary',
  onPress,
  disabled,
  style,
  small,
}: {
  label: string;
  icon?: LucideIcon;
  tone?: ButtonTone;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const fg = {
    primary: colors.textOnStrong,
    secondary: colors.text,
    accent: colors.textOnStrong,
    ghost: colors.text,
    onStrong: colors.text,
  }[tone];
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        buttonTone[tone],
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}>
      {Icon ? <Icon size={small ? 16 : 18} color={fg} strokeWidth={2} /> : null}
      <Txt variant="bodyStrong" color={fg} style={small ? { fontSize: 14 } : undefined}>
        {label}
      </Txt>
    </Pressable>
  );
}

const buttonTone = StyleSheet.create({
  primary: { backgroundColor: colors.cardStrong },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.text },
  accent: { backgroundColor: colors.accent },
  ghost: { backgroundColor: colors.bgAlt },
  onStrong: { backgroundColor: colors.textOnStrong },
});

export function IconButton({
  icon: Icon,
  onPress,
  tone = 'soft',
  size = 40,
  label,
}: {
  icon: LucideIcon;
  onPress?: () => void;
  tone?: 'soft' | 'strong' | 'onStrong' | 'plain';
  size?: number;
  label: string;
}) {
  const bg = { soft: colors.bgAlt, strong: colors.cardStrong, onStrong: colors.trackOnStrong, plain: 'transparent' }[tone];
  const fg = tone === 'strong' || tone === 'onStrong' ? colors.textOnStrong : colors.text;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        pressed && { opacity: 0.7 },
      ]}>
      <Icon size={size * 0.5} color={fg} strokeWidth={1.9} />
    </Pressable>
  );
}

// ---------- Chips e segmentos ----------

export function Chip({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        small && { paddingVertical: 6, paddingHorizontal: 12 },
        active ? { backgroundColor: colors.cardStrong, borderColor: colors.cardStrong } : null,
        pressed && { opacity: 0.8 },
      ]}>
      <Txt
        variant="small"
        color={active ? colors.textOnStrong : colors.text}
        style={{ fontFamily: fonts.sansMedium }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  onStrong,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  onStrong?: boolean;
}) {
  return (
    <View style={[styles.segmented, onStrong && { backgroundColor: colors.trackOnStrong }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segment, active && { backgroundColor: onStrong ? colors.textOnStrong : colors.card }]}>
            <Txt
              variant="small"
              style={{ fontFamily: active ? fonts.sansSemi : fonts.sansMedium }}
              color={onStrong ? (active ? colors.text : colors.textOnStrongMuted) : active ? colors.text : colors.textSecondary}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Barras ----------

export function ProgressBar({
  value,
  color = colors.cardStrong,
  track = colors.track,
  height = 8,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color, minWidth: pct > 0 ? height : 0 }} />
    </View>
  );
}

// ---------- Formulário ----------

export function Field({
  label,
  suffix,
  style,
  ...input
}: TextInputProps & { label?: string; suffix?: string }) {
  return (
    <View style={[{ gap: 6 }, style as StyleProp<ViewStyle>]}>
      {label ? <Txt variant="label">{label}</Txt> : null}
      <View style={styles.field}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          {...input}
          style={[styles.input, input.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
        />
        {suffix ? <Txt variant="small">{suffix}</Txt> : null}
      </View>
    </View>
  );
}

export function Row({ children, style, gap = space.md }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.lineSoft }} />;
}

export function PressableRow({
  children,
  onPress,
  ...rest
}: PressableProps & { children: ReactNode }) {
  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        tap();
        onPress?.(e);
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
      {children}
    </Pressable>
  );
}

export function Stat({ label, value, unit, onStrong }: { label: string; value: string; unit?: string; onStrong?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <Txt variant="caption" color={onStrong ? colors.textOnStrongMuted : colors.textMuted}>
        {label}
      </Txt>
      <Txt variant="bodyStrong" color={onStrong ? colors.textOnStrong : colors.text} style={{ fontSize: 17 }}>
        {value}
        {unit ? (
          <Txt variant="small" color={onStrong ? colors.textOnStrongMuted : colors.textSecondary}>
            {' '}
            {unit}
          </Txt>
        ) : null}
      </Txt>
    </View>
  );
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <Txt variant="caption" align="center" style={{ paddingHorizontal: space.lg, marginTop: space.md }}>
      {children ?? 'Conteúdo educacional. Não substitui acompanhamento médico e nutricional.'}
    </Txt>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.xl, gap: space.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, minHeight: 28 },
  button: {
    height: 52,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonSmall: { height: 40, paddingHorizontal: space.lg },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  segmented: { flexDirection: 'row', backgroundColor: colors.bgAlt, borderRadius: radius.pill, padding: 3 },
  segment: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.pill, alignItems: 'center' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 50,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
    outlineStyle: 'none',
  } as object,
});
