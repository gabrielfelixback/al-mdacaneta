// Cliente do endpoint de análise de refeição por foto (ver /server).
// A chave da API do Claude fica só no servidor, nunca no app.

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

export const MEAL_API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export async function analyzeMealPhoto(base64: string, mediaType: string, context?: string): Promise<MealAnalysis> {
  if (!MEAL_API_URL) {
    throw new Error('Servidor de análise não configurado (EXPO_PUBLIC_API_URL).');
  }
  const res = await fetch(`${MEAL_API_URL}/api/analyze-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mediaType, context }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Falha na análise (${res.status}).`);
  }
  return (await res.json()) as MealAnalysis;
}
