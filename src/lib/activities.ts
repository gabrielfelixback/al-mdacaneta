// Valores de MET aproximados do Compendium of Physical Activities (2024).
// Gasto (kcal) = MET × peso (kg) × duração (h).

export type Intensity = 'leve' | 'moderado' | 'intenso';

export interface ActivityType {
  id: string;
  label: string;
  met: Record<Intensity, number>;
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: 'caminhada', label: 'Caminhada', met: { leve: 2.8, moderado: 3.5, intenso: 5.0 } },
  { id: 'musculacao', label: 'Musculação', met: { leve: 3.5, moderado: 5.0, intenso: 6.0 } },
  { id: 'corrida', label: 'Corrida', met: { leve: 7.0, moderado: 9.8, intenso: 11.5 } },
  { id: 'bike', label: 'Bicicleta', met: { leve: 4.0, moderado: 6.8, intenso: 10.0 } },
  { id: 'natacao', label: 'Natação', met: { leve: 5.8, moderado: 7.0, intenso: 9.8 } },
  { id: 'funcional', label: 'Funcional / HIIT', met: { leve: 4.0, moderado: 6.0, intenso: 8.0 } },
  { id: 'pilates', label: 'Pilates / Yoga', met: { leve: 2.5, moderado: 3.0, intenso: 4.0 } },
  { id: 'danca', label: 'Dança', met: { leve: 4.5, moderado: 5.5, intenso: 7.8 } },
  { id: 'esporte', label: 'Esporte coletivo', met: { leve: 5.0, moderado: 7.0, intenso: 10.0 } },
  { id: 'outro', label: 'Outra atividade', met: { leve: 3.0, moderado: 5.0, intenso: 7.0 } },
];

export const INTENSITY_LABEL: Record<Intensity, string> = {
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
};

export const INTENSITY_HINT: Record<Intensity, string> = {
  leve: 'Dá para conversar e cantar',
  moderado: 'Dá para conversar, não cantar',
  intenso: 'Poucas palavras por vez',
};

export function getActivityType(id: string): ActivityType {
  return ACTIVITY_TYPES.find((a) => a.id === id) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
}

export function activityKcal(typeId: string, intensity: Intensity, minutes: number, weightKg: number): number {
  const met = getActivityType(typeId).met[intensity];
  return Math.round(met * weightKg * (minutes / 60));
}
