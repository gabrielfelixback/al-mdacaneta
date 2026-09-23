import { Alert, Platform, Share } from 'react-native';
import { create } from 'zustand';

// Avisos visíveis em todas as plataformas: no navegador, alert()/confirm() podem ser bloqueados.
interface ToastState {
  toast: { title: string; message?: string; id: number } | null;
  show: (title: string, message?: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (title, message) => set({ toast: { title, message, id: Date.now() } }),
  hide: () => set({ toast: null }),
}));

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') useToast.getState().show(title, message);
  else Alert.alert(title, message);
}

/** Compartilha texto; onde o compartilhamento não existe (navegador), copia para a área de transferência. */
export async function shareText(message: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await Share.share({ message }).catch(() => {});
    return;
  }
  try {
    await navigator.clipboard.writeText(message);
    notify('Copiado', 'O texto foi copiado. Cole onde quiser compartilhar.');
  } catch {
    notify('Não foi possível copiar', 'Seu navegador bloqueou a área de transferência.');
  }
}
