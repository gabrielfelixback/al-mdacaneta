import { isRunningInExpoGo } from 'expo';

/** No Expo Go os módulos nativos de saúde não existem; só carregamos em builds próprios. */
export const HEALTH_NATIVE_AVAILABLE = !isRunningInExpoGo();

/** Carrega um módulo nativo sob demanda, sem derrubar o app se ele não estiver no build. */
export function loadNative<T>(load: () => T): T | null {
  if (!HEALTH_NATIVE_AVAILABLE) return null;
  try {
    return load();
  } catch {
    return null;
  }
}
