import { useMemo } from 'react';

import { bmi, bmr, nutritionGoals } from '@/lib/calc';
import { currentWeight, useStore } from '@/store/useStore';

/** Metas diárias derivadas do perfil e do peso mais recente. */
export function usePlan() {
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  return useMemo(() => {
    if (!profile) return null;
    const weight = currentWeight({ weights, profile }) ?? profile.startWeightKg;
    const age = new Date().getFullYear() - profile.birthYear;
    const goals = nutritionGoals({
      sex: profile.sex,
      weightKg: weight,
      heightCm: profile.heightCm,
      age,
      level: profile.activityLevel,
    });
    return {
      profile,
      weight,
      age,
      bmi: bmi(weight, profile.heightCm),
      bmr: bmr(profile.sex, weight, profile.heightCm, age),
      goals,
    };
  }, [profile, weights]);
}
