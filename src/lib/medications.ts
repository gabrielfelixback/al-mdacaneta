// Catálogo de agonistas de GLP-1 / GIP-GLP-1 comuns no Brasil.
// Meias-vidas aproximadas das bulas (FDA/DailyMed e ANVISA) — ver src/lib/references.ts.

export type ActiveIngredient = 'tirzepatida' | 'semaglutida' | 'liraglutida' | 'dulaglutida';

export type Frequency = 'semanal' | 'diaria';

export interface Medication {
  id: string;
  name: string;
  ingredient: ActiveIngredient;
  frequency: Frequency;
  doses: number[];
  /** Permite digitar o nome comercial que está na embalagem (genéricos, manipulados etc.). */
  customName?: boolean;
}

export const HALF_LIFE_HOURS: Record<ActiveIngredient, number> = {
  tirzepatida: 120, // ~5 dias
  semaglutida: 168, // ~7 dias
  liraglutida: 13,
  dulaglutida: 120, // ~5 dias
};

export const INGREDIENT_LABEL: Record<ActiveIngredient, string> = {
  tirzepatida: 'Tirzepatida',
  semaglutida: 'Semaglutida',
  liraglutida: 'Liraglutida',
  dulaglutida: 'Dulaglutida',
};

const TIRZ = [2.5, 5, 7.5, 10, 12.5, 15];
const SEMA_OZ = [0.25, 0.5, 1, 2];
const SEMA_WEG = [0.25, 0.5, 1, 1.7, 2.4];

export const MEDICATIONS: Medication[] = [
  { id: 'mounjaro', name: 'Mounjaro', ingredient: 'tirzepatida', frequency: 'semanal', doses: TIRZ },
  { id: 'ozempic', name: 'Ozempic', ingredient: 'semaglutida', frequency: 'semanal', doses: SEMA_OZ },
  { id: 'wegovy', name: 'Wegovy', ingredient: 'semaglutida', frequency: 'semanal', doses: SEMA_WEG },
  { id: 'saxenda', name: 'Saxenda', ingredient: 'liraglutida', frequency: 'diaria', doses: [0.6, 1.2, 1.8, 2.4, 3] },
  { id: 'trulicity', name: 'Trulicity', ingredient: 'dulaglutida', frequency: 'semanal', doses: [0.75, 1.5, 3, 4.5] },
  {
    id: 'tirzepatida-outra',
    name: 'Tirzepatida (outra marca)',
    ingredient: 'tirzepatida',
    frequency: 'semanal',
    doses: TIRZ,
    customName: true,
  },
  {
    id: 'semaglutida-outra',
    name: 'Semaglutida (outra marca)',
    ingredient: 'semaglutida',
    frequency: 'semanal',
    doses: SEMA_WEG,
    customName: true,
  },
];

export function getMedication(id: string): Medication {
  return MEDICATIONS.find((m) => m.id === id) ?? MEDICATIONS[0];
}

export const INJECTION_SITES = [
  { id: 'abd-e', label: 'Abdômen esq.' },
  { id: 'abd-d', label: 'Abdômen dir.' },
  { id: 'coxa-e', label: 'Coxa esq.' },
  { id: 'coxa-d', label: 'Coxa dir.' },
  { id: 'braco-e', label: 'Braço esq.' },
  { id: 'braco-d', label: 'Braço dir.' },
] as const;

export type InjectionSite = (typeof INJECTION_SITES)[number]['id'];

export function siteLabel(id?: string): string {
  return INJECTION_SITES.find((s) => s.id === id)?.label ?? '—';
}

/** Sugere o próximo local seguindo o rodízio, a partir do último usado. */
export function nextSite(last?: string): InjectionSite {
  const i = INJECTION_SITES.findIndex((s) => s.id === last);
  return INJECTION_SITES[(i + 1) % INJECTION_SITES.length].id;
}

export const SIDE_EFFECTS = [
  'Náusea',
  'Constipação',
  'Diarreia',
  'Refluxo / azia',
  'Cansaço',
  'Dor de cabeça',
  'Estufamento',
  'Tontura',
  'Queda de cabelo',
  'Reação no local',
] as const;
