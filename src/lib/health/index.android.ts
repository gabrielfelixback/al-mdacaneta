// Health Connect (Android) via react-native-health-connect. Requer development build:
// o módulo é carregado sob demanda para o app abrir normalmente no Expo Go.
import type * as HealthConnectModule from 'react-native-health-connect';

import { loadNative } from './native';
import type { HealthBridge } from './types';

export type { HealthBridge, HealthDay } from './types';

type HealthConnect = typeof HealthConnectModule;

let cached: HealthConnect | null | undefined;
function hc(): HealthConnect | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carregamento sob demanda do módulo nativo
  if (cached === undefined) cached = loadNative(() => require('react-native-health-connect') as HealthConnect);
  return cached;
}

function dayRange(day: Date) {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  return { operator: 'between' as const, startTime: start.toISOString(), endTime: end.toISOString() };
}

let initialized = false;
async function ensureInit(): Promise<HealthConnect | null> {
  const m = hc();
  if (!m) return null;
  if (!initialized) initialized = await m.initialize().catch(() => false);
  return initialized ? m : null;
}

export const health: HealthBridge = {
  label: 'Health Connect',
  isSupported: async () => {
    const m = hc();
    if (!m) return false;
    return (await m.getSdkStatus().catch(() => -1)) === m.SdkAvailabilityStatus.SDK_AVAILABLE;
  },
  connect: async () => {
    const m = await ensureInit();
    if (!m) return false;
    const granted = await m
      .requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'Weight' },
        { accessType: 'write', recordType: 'Weight' },
        { accessType: 'write', recordType: 'Hydration' },
      ])
      .catch(() => []);
    return granted.length > 0;
  },
  readDay: async (day) => {
    const m = await ensureInit();
    if (!m) return { steps: 0, activeKcal: 0 };
    const timeRangeFilter = dayRange(day);
    const [steps, kcal] = await Promise.all([
      m.aggregateRecord({ recordType: 'Steps', timeRangeFilter }).catch(() => null),
      m.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }).catch(() => null),
    ]);
    return {
      steps: steps?.COUNT_TOTAL ?? 0,
      activeKcal: Math.round(kcal?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0),
    };
  },
  writeWeight: async (kg, at) => {
    const m = await ensureInit();
    await m?.insertRecords([{ recordType: 'Weight', time: at.toISOString(), weight: { unit: 'kilograms', value: kg } }]).catch(() => undefined);
  },
  writeWater: async (ml, at) => {
    const m = await ensureInit();
    if (!m) return;
    const end = new Date(at.getTime() + 60_000);
    await m
      .insertRecords([
        { recordType: 'Hydration', startTime: at.toISOString(), endTime: end.toISOString(), volume: { unit: 'milliliters', value: ml } },
      ])
      .catch(() => undefined);
  },
};
