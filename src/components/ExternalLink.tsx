import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { tap } from './ui';

/**
 * Link para fora do app. No celular abre o navegador interno; na web vira um <a target="_blank">
 * (janelas abertas por script são bloqueadas em vários navegadores).
 */
export function ExternalLink({ href, children, style }: { href: `https://${string}`; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  if (Platform.OS === 'web') {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" asChild>
        <Pressable style={style}>{children}</Pressable>
      </Link>
    );
  }
  return (
    <Pressable
      accessibilityRole="link"
      style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}
      onPress={() => {
        tap();
        WebBrowser.openBrowserAsync(href).catch(() => {});
      }}>
      {children}
    </Pressable>
  );
}
