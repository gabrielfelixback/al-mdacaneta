import type { ActivityLevel, Sex } from '@/lib/calc';
import type { Intensity } from '@/lib/activities';

export type MealSlot = 'cafe' | 'almoco' | 'lanche' | 'jantar';

export const MEAL_SLOTS: { id: MealSlot; label: string; hint: string }[] = [
  { id: 'cafe', label: 'Café da manhã', hint: 'Comece pela proteína' },
  { id: 'almoco', label: 'Almoço', hint: 'Prato pequeno, proteína no centro' },
  { id: 'lanche', label: 'Lanches', hint: 'Opções rápidas para os dias sem fome' },
  { id: 'jantar', label: 'Jantar', hint: 'Leve e fácil de digerir' },
];

export interface Profile {
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  createdAt: string;
}

export interface Treatment {
  medicationId: string;
  brandName?: string;
  doseMg: number;
  /** 0 = domingo */
  weekday: number;
  time: string; // HH:MM
  startedAt: string;
  concentrationMgMl?: number;
  /** Frasco para a calculadora: mg totais e volume em mL. */
  vialMg?: number;
  vialMl?: number;
  /** Capacidade da seringa de insulina U-100 usada (30, 50 ou 100 UI). */
  syringeUi?: 30 | 50 | 100;
}

export interface ProState {
  active: boolean;
  plan?: 'mensal' | 'anual' | 'metodo3p';
  since?: string;
  renewsAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
}

export interface DoseLog {
  id: string;
  at: string;
  mg: number;
  medicationId: string;
  site?: string;
  note?: string;
}

export interface WeightLog {
  id: string;
  at: string;
  kg: number;
  waistCm?: number;
}

export interface MealEntry {
  id: string;
  day: string;
  slot: MealSlot;
  name: string;
  portion?: string;
  qty: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  source: 'base' | 'foto' | 'manual';
  at: string;
}

export interface ActivityLog {
  id: string;
  day: string;
  typeId: string;
  intensity: Intensity;
  minutes: number;
  kcal: number;
  source: 'manual' | 'saude';
  at: string;
}

export interface SideEffectLog {
  id: string;
  at: string;
  kind: string;
  severity: 1 | 2 | 3;
  note?: string;
}

export type Gut = 'normal' | 'lento' | 'travado' | 'solto';

export interface CheckIn {
  energy?: 1 | 2 | 3 | 4 | 5;
  hunger?: 1 | 2 | 3 | 4 | 5;
  gut?: Gut;
}

export interface Reminder {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

export interface Post {
  id: string;
  author: string;
  mine?: boolean;
  at: string;
  body: string;
  tag?: string;
  likes: number;
  liked?: boolean;
  comments: { id: string; author: string; body: string; at: string }[];
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; label: string; votes: number }[];
  voted?: string;
  at: string;
}
