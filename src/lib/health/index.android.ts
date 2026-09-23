// Health Connect (Android) via react-native-health-connect. Requer development build.
import {
  aggregateRecord,
  getSdkStatus,
  initialize,
  insertRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import type { HealthBridge } from './types';

export type { HealthBridge, HealthDay } from './types';

function dayRange(day: Date) {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  return { operator: 'between' as const, startTime: start.toISOString(), endTime: end.toISOString() };
}

let initialized = false;
async function ensureInit() {
  if (!initialized) initialized = await initialize();
  return initialized;
}

export const health: HealthBridge = {
  label: 'Health Connect',
  isSupported: async () => (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE,
  connect: async () => {
    if (!(await ensureInit())) return false;
    const granted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'write', recordType: 'Weight' },
      { accessType: 'write', recordType: 'Hydration' },
    ]);
    return granted.length > 0;
  },
  readDay: async (day) => {
    if (!(await ensureInit())) return { steps: 0, activeKcal: 0 };
    const timeRangeFilter = dayRange(day);
    const [steps, kcal] = await Promise.all([
      aggregateRecord({ recordType: 'Steps', timeRangeFilter }).catch(() => null),
      aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }).catch(() => null),
    ]);
    return {
      steps: steps?.COUNT_TOTAL ?? 0,
      activeKcal: Math.round(kcal?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0),
    };
  },
  writeWeight: async (kg, at) => {
    if (!(await ensureInit())) return;
    await insertRecords([
      { recordType: 'Weight', time: at.toISOString(), weight: { unit: 'kilograms', value: kg } },
    ]).catch(() => undefined);
  },
  writeWater: async (ml, at) => {
    if (!(await ensureInit())) return;
    const end = new Date(at.getTime() + 60_000);
    await insertRecords([
      {
        recordType: 'Hydration',
        startTime: at.toISOString(),
        endTime: end.toISOString(),
        volume: { unit: 'milliliters', value: ml },
      },
    ]).catch(() => undefined);
  },
};
