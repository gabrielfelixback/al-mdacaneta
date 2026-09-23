import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHydrated } from '@/store/useHydrated';
import { useStore } from '@/store/useStore';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.profile !== null);
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const modal = { presentation: 'modal' as const, animation: 'slide_from_bottom' as const };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="registrar" options={{ ...modal, presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="peso" options={modal} />
          <Stack.Screen name="refeicao" options={modal} />
          <Stack.Screen name="atividade" options={modal} />
          <Stack.Screen name="aplicacao" options={modal} />
          <Stack.Screen name="efeito" options={modal} />
          <Stack.Screen name="publicar" options={modal} />
          <Stack.Screen name="post/[id]" />
          <Stack.Screen name="calculadora" />
          <Stack.Screen name="referencias" />
          <Stack.Screen name="configuracoes" />
          <Stack.Screen name="tratamento" />
          <Stack.Screen name="meus-dados" />
          <Stack.Screen name="historico-peso" />
          <Stack.Screen name="relatorio" />
          <Stack.Screen name="pro" options={{ ...modal, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="biblioteca" />
          <Stack.Screen name="assistente" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
