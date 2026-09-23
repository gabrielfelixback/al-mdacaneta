import { useEffect, useState } from 'react';

import { useStore } from './useStore';

/** true quando o estado persistido já foi carregado (ou após 2 s, para nunca travar a abertura). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    const timer = setTimeout(() => setHydrated(true), 2000);
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [hydrated]);
  return hydrated;
}
