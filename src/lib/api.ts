// Chamadas ao servidor do app (análise de foto e assistente), com tempo limite e mensagens claras.

export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export class ApiUnavailableError extends Error {}

export async function postJson<T>(path: string, body: unknown, timeoutMs = 90_000): Promise<T> {
  if (!API_URL) throw new ApiUnavailableError('Este recurso ainda não está disponível nesta versão de teste.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    throw new Error(
      (e as Error).name === 'AbortError'
        ? 'Demorou mais que o esperado. Tente de novo.'
        : 'Sem conexão com o servidor. Verifique a internet e tente de novo.',
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg && msg.length < 200 ? msg : `Não foi possível concluir agora (erro ${res.status}).`);
  }
  return (await res.json()) as T;
}
