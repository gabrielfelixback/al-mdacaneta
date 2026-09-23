import { useEffect, useState } from 'react';

import { useStore } from './useStore';

/** true quando o estado persistido já foi carregado do armazenamento. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}
