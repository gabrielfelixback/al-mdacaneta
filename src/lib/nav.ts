import { router } from 'expo-router';

/** Fecha o modal atual; se não houver histórico (ex.: link direto), volta para o início. */
export function dismiss() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
