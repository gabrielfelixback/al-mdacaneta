// Apple Saúde (HealthKit) via @kingstinct/react-native-healthkit. Requer development build (não roda no Expo Go).
import {
  isHealthDataAvailableAsync,
  queryStatisticsForQuantity,
  requestAuthorization,
  saveQuantitySample,
} from '@kingstinct/react-native-healthkit';

import type { HealthBridge } from './types';

export type { HealthBridge, HealthDay } from './types';

let authorized = false;

async function ensureAuth() {
  if (authorized) return true;
  authorized = await requestAuthorization({
    toRead: ['HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierActiveEnergyBurned', 'HKQuantityTypeIdentifierBodyMass'],
    toShare: ['HKQuantityTypeIdentifierBodyMass', 'HKQuantityTypeIdentifierDietaryWater'],
  });
  return authorized;
}

function dayFilter(day: Date) {
  const startDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const endDate = new Date(startDate.getTime() + 86_400_000);
  return { filter: { date: { startDate, endDate } } };
}

export const health: HealthBridge = {
  label: 'Apple Saúde',
  isSupported: () => isHealthDataAvailableAsync(),
  connect: () => ensureAuth(),
  readDay: async (day) => {
    if (!(await ensureAuth())) return { steps: 0, activeKcal: 0 };
    const [steps, kcal] = await Promise.all([
      queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], { ...dayFilter(day), unit: 'count' }).catch(
        () => null,
      ),
      queryStatisticsForQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', ['cumulativeSum'], {
        ...dayFilter(day),
        unit: 'kcal',
      }).catch(() => null),
    ]);
    return {
      steps: Math.round(steps?.sumQuantity?.quantity ?? 0),
      activeKcal: Math.round(kcal?.sumQuantity?.quantity ?? 0),
    };
  },
  writeWeight: async (kg, at) => {
    if (!(await ensureAuth())) return;
    await saveQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg', kg, at, at).catch(() => undefined);
  },
  writeWater: async (ml, at) => {
    if (!(await ensureAuth())) return;
    await saveQuantitySample('HKQuantityTypeIdentifierDietaryWater', 'ml', ml, at, at).catch(() => undefined);
  },
};
