import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MAX_WIDTH, space } from '@/theme/tokens';
import { Txt } from './Txt';
import { IconButton } from './ui';

export const TAB_BAR_SPACE = 120;

/** Tela de aba: título grande em serifa + conteúdo rolável. */
export function TabScreen({
  title,
  italicWord,
  right,
  children,
  subtitle,
}: {
  title: string;
  italicWord?: string;
  right?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + TAB_BAR_SPACE }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Txt variant="title">
              {title}
              {italicWord ? (
                <Txt variant="title" italic>
                  {' '}
                  {italicWord}
                </Txt>
              ) : null}
            </Txt>
            {subtitle}
          </View>
          {right}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

/** Tela empilhada com botão de voltar. */
export function StackScreen({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxxl }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        <View style={[styles.header, { alignItems: 'center' }]}>
          <IconButton icon={ChevronLeft} label="Voltar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          <Txt variant="h2" style={{ flex: 1 }}>
            {title}
          </Txt>
          {right}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

/** Tela modal de registro: cabeçalho com fechar + rodapé fixo com ação. */
export function ModalScreen({
  title,
  italicWord,
  children,
  footer,
  scroll = true,
}: {
  title: string;
  italicWord?: string;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'ios' ? space.lg : insets.top + space.md;
  const body = <View style={[styles.inner, { gap: space.lg }]}>{children}</View>;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.inner, styles.header, { paddingTop: top, alignItems: 'center' }]}>
        <Txt variant="h2" style={{ flex: 1 }}>
          {title}
          {italicWord ? (
            <Txt variant="h2" italic>
              {' '}
              {italicWord}
            </Txt>
          ) : null}
        </Txt>
        <IconButton icon={X} label="Fechar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space.xxl }}>
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}
      {footer ? (
        <View style={[styles.inner, { paddingBottom: insets.bottom + space.lg, paddingTop: space.md }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.sm },
});
