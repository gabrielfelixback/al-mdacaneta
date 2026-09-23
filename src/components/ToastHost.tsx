import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/lib/notify';
import { colors, MAX_WIDTH, radius, space } from '@/theme/tokens';
import { Txt } from './Txt';

export function ToastHost() {
  const toast = useToast((s) => s.toast);
  const hide = useToast((s) => s.hide);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hide, 5000);
    return () => clearTimeout(t);
  }, [toast, hide]);

  if (!toast) return null;
  return (
    <View style={{ position: 'absolute', top: insets.top + space.md, left: 0, right: 0, alignItems: 'center', paddingHorizontal: space.lg, pointerEvents: 'box-none' }}>
      <Pressable
        accessibilityRole="alert"
        onPress={hide}
        style={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          flexDirection: 'row',
          gap: space.md,
          backgroundColor: colors.cardStrong,
          borderRadius: radius.lg,
          padding: space.lg,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 12,
        }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong" color={colors.textOnStrong}>
            {toast.title}
          </Txt>
          {toast.message ? (
            <Txt variant="small" color={colors.textOnStrongMuted}>
              {toast.message}
            </Txt>
          ) : null}
        </View>
        <X size={18} color={colors.textOnStrongMuted} />
      </Pressable>
    </View>
  );
}
