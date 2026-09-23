// Fallback (web e plataformas sem integração). O Metro escolhe
// index.ios.ts / index.android.ts automaticamente nos apps nativos.
import type { HealthBridge } from './types';

export type { HealthBridge, HealthDay } from './types';

export const health: HealthBridge = {
  label: 'app de saúde',
  isSupported: async () => false,
  connect: async () => false,
  readDay: async () => ({ steps: 0, activeKcal: 0 }),
  writeWeight: async () => {},
  writeWater: async () => {},
};
