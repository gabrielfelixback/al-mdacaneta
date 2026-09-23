import type { ComponentType } from 'react';

import { useStore } from '@/store/useStore';

/** Só renderiza a tela quando perfil e tratamento existem (ex.: evita erro logo após "Apagar meus dados"). */
export function requireSetup<P extends object>(Screen: ComponentType<P>) {
  return function Guarded(props: P) {
    const ready = useStore((s) => s.profile !== null && s.treatment !== null);
    return ready ? <Screen {...props} /> : null;
  };
}
