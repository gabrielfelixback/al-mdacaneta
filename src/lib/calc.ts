import { HALF_LIFE_HOURS, type ActiveIngredient } from './medications';

export type Sex = 'f' | 'm';
export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso';

export const ACTIVITY_LEVEL_LABEL: Record<ActivityLevel, string> = {
  sedentario: 'Sedentária(o)',
  leve: 'Levemente ativa(o)',
  moderado: 'Moderadamente ativa(o)',
  intenso: 'Muito ativa(o)',
};

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
};

// ---------- IMC (classificação OMS) ----------

export type BmiClass = 'abaixo' | 'saudavel' | 'sobrepeso' | 'obesidade';

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  if (!m) return 0;
  return weightKg / (m * m);
}

export function bmiClass(value: number): BmiClass {
  if (value < 18.5) return 'abaixo';
  if (value < 25) return 'saudavel';
  if (value < 30) return 'sobrepeso';
  return 'obesidade';
}

export const BMI_LABEL: Record<BmiClass, string> = {
  abaixo: 'Abaixo do peso',
  saudavel: 'Saudável',
  sobrepeso: 'Sobrepeso',
  obesidade: 'Obesidade',
};

/** Posição 0..1 do IMC na régua 15–40. */
export function bmiScalePosition(value: number): number {
  return Math.min(1, Math.max(0, (value - 15) / 25));
}

// ---------- Energia ----------

/** Taxa metabólica basal — Mifflin-St Jeor (1990). */
export function bmr(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === 'm' ? base + 5 : base - 161);
}

export function tdee(bmrValue: number, level: ActivityLevel): number {
  return Math.round(bmrValue * ACTIVITY_FACTOR[level]);
}

/** Meta calórica com déficit moderado e piso de segurança. */
export function calorieGoal(sex: Sex, tdeeValue: number): number {
  const floor = sex === 'm' ? 1500 : 1200;
  return Math.max(floor, Math.round((tdeeValue - 500) / 50) * 50);
}

/**
 * Peso de referência para proteína: com IMC ≥ 30, usa o peso ajustado
 * (peso no IMC 25 + 25% do excedente) para não superestimar a meta.
 */
export function proteinReferenceWeight(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  const ideal = 25 * m * m;
  if (bmi(weightKg, heightCm) < 30) return weightKg;
  return ideal + 0.25 * (weightKg - ideal);
}

export interface NutritionGoals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
}

export function nutritionGoals(p: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  level: ActivityLevel;
}): NutritionGoals {
  const kcal = calorieGoal(p.sex, tdee(bmr(p.sex, p.weightKg, p.heightCm, p.age), p.level));
  // Método 3P · P1: proteína primeiro (1,5 g/kg do peso de referência).
  const protein = Math.round(1.5 * proteinReferenceWeight(p.weightKg, p.heightCm));
  const fat = Math.round((kcal * 0.3) / 9);
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = p.sex === 'm' ? 30 : 25;
  const waterMl = Math.round((p.weightKg * 35) / 100) * 100;
  return { kcal, protein, carbs, fat, fiber, waterMl };
}

// ---------- Nível estimado do medicamento ----------

export interface DosePoint {
  at: string; // ISO
  mg: number;
  ingredient: ActiveIngredient;
}

/**
 * Estimativa educacional da quantidade circulante: soma de cada dose
 * decaindo pela meia-vida (modelo de eliminação de primeira ordem, sem fase de absorção).
 */
export function medicationLevelAt(doses: DosePoint[], t: Date): number {
  const time = t.getTime();
  let total = 0;
  for (const d of doses) {
    const dt = (time - new Date(d.at).getTime()) / 3_600_000;
    if (dt < 0) continue;
    total += d.mg * Math.pow(0.5, dt / HALF_LIFE_HOURS[d.ingredient]);
  }
  return total;
}

// ---------- Calculadora de doses (U-100: 1 mL = 100 UI) ----------

export function doseToUnits(doseMg: number, concentrationMgPerMl: number): { ml: number; units: number } {
  if (!concentrationMgPerMl) return { ml: 0, units: 0 };
  const ml = doseMg / concentrationMgPerMl;
  return { ml, units: ml * 100 };
}

// ---------- Formatação ----------

export function fmt(n: number, digits = 1): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

export function fmtMg(n: number): string {
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mg`;
}
