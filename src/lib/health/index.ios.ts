// Apple Saúde (HealthKit) via @kingstinct/react-native-healthkit. Requer development build:
// o módulo é carregado sob demanda para o app abrir normalmente no Expo Go.
import type * as HealthKitModule from '@kingstinct/react-native-healthkit';

import { loadNative } from './native';
import type { HealthBridge } from './types';

export type { HealthBridge, HealthDay } from './types';

type HealthKit = typeof HealthKitModule;

let cached: HealthKit | null | undefined;
function hk(): HealthKit | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carregamento sob demanda do módulo nativo
  if (cached === undefined) cached = loadNative(() => require('@kingstinct/react-native-healthkit') as HealthKit);
  return cached;
}

let authorized = false;

async function ensureAuth(): Promise<HealthKit | null> {
  const m = hk();
  if (!m) return null;
  if (!authorized) {
    authorized = await m
      .requestAuthorization({
        toRead: ['HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierActiveEnergyBurned', 'HKQuantityTypeIdentifierBodyMass'],
        toShare: ['HKQuantityTypeIdentifierBodyMass', 'HKQuantityTypeIdentifierDietaryWater'],
      })
      .catch(() => false);
  }
  return authorized ? m : null;
}

function dayFilter(day: Date) {
  const startDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const endDate = new Date(startDate.getTime() + 86_400_000);
  return { filter: { date: { startDate, endDate } } };
}

export const health: HealthBridge = {
  label: 'Apple Saúde',
  isSupported: async () => {
    const m = hk();
    return m ? m.isHealthDataAvailableAsync().catch(() => false) : false;
  },
  connect: async () => (await ensureAuth()) !== null,
  readDay: async (day) => {
    const m = await ensureAuth();
    if (!m) return { steps: 0, activeKcal: 0 };
    const [steps, kcal] = await Promise.all([
      m.queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], { ...dayFilter(day), unit: 'count' }).catch(() => null),
      m.queryStatisticsForQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', ['cumulativeSum'], { ...dayFilter(day), unit: 'kcal' }).catch(
        () => null,
      ),
    ]);
    return {
      steps: Math.round(steps?.sumQuantity?.quantity ?? 0),
      activeKcal: Math.round(kcal?.sumQuantity?.quantity ?? 0),
    };
  },
  writeWeight: async (kg, at) => {
    const m = await ensureAuth();
    await m?.saveQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg', kg, at, at).catch(() => undefined);
  },
  writeWater: async (ml, at) => {
    const m = await ensureAuth();
    await m?.saveQuantitySample('HKQuantityTypeIdentifierDietaryWater', 'ml', ml, at, at).catch(() => undefined);
  },
};
