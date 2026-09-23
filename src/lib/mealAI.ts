// Cliente do endpoint de análise de refeição por foto (ver /server).
// A chave da API do Claude fica só no servidor, nunca no app.
import { postJson } from './api';

export interface MealItem {
  name: string;
  portion: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface MealAnalysis {
  is_food: boolean;
  items: MealItem[];
  confidence: 'baixa' | 'media' | 'alta';
  tip: string;
}

export async function analyzeMealPhoto(base64: string, mediaType: string, context?: string): Promise<MealAnalysis> {
  return postJson<MealAnalysis>('/api/analyze-meal', { image: base64, mediaType, context });
}
