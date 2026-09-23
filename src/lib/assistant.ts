import { MEAL_API_URL } from './mealAI';

export const FREE_DAILY_QUESTIONS = 3;

export async function askAssistant(messages: { role: 'user' | 'assistant'; text: string }[], context: string): Promise<string> {
  if (!MEAL_API_URL) throw new Error('Assistente indisponível: servidor não configurado (EXPO_PUBLIC_API_URL).');
  const res = await fetch(`${MEAL_API_URL}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `Falha no assistente (${res.status}).`);
  const data = (await res.json()) as { text: string };
  return data.text;
}
