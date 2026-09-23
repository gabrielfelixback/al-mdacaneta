import { postJson } from './api';

export const FREE_DAILY_QUESTIONS = 3;

export async function askAssistant(messages: { role: 'user' | 'assistant'; text: string }[], context: string): Promise<string> {
  const data = await postJson<{ text: string }>('/api/assistant', { messages, context });
  return data.text;
}
