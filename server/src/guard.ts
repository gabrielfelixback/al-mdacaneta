import type { Context, MiddlewareHandler } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

// Proteções para a API não ser usada por terceiros para gastar os créditos do Claude.

/** Chave compartilhada opcional (APP_API_KEY): o app envia no cabeçalho x-app-key. */
export function requireAppKey(): MiddlewareHandler {
  const key = process.env.APP_API_KEY;
  return async (c, next) => {
    if (key && c.req.header('x-app-key') !== key) return c.text('Não autorizado.', 401);
    await next();
  };
}

function clientIp(c: Context): string {
  // Atrás de proxy (Render, Fly, Railway…), TRUST_PROXY=1 usa o primeiro IP do X-Forwarded-For.
  if (process.env.TRUST_PROXY === '1') {
    const fwd = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (fwd) return fwd;
  }
  try {
    return getConnInfo(c).remote.address ?? 'desconhecido';
  } catch {
    return 'desconhecido';
  }
}

/** Limite simples em memória: `max` requisições por janela de `windowMs`, por IP e por rota. */
export function rateLimit({ max, windowMs }: { max: number; windowMs: number }): MiddlewareHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  return async (c, next) => {
    const now = Date.now();
    const id = `${clientIp(c)}:${c.req.path}`;
    const entry = hits.get(id);
    if (!entry || entry.reset <= now) {
      hits.set(id, { count: 1, reset: now + windowMs });
    } else if (++entry.count > max) {
      c.header('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return c.text('Muitas solicitações em pouco tempo. Tente de novo em instantes.', 429);
    }
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }
    await next();
  };
}

/** Origens liberadas para o navegador (ALLOWED_ORIGINS, separadas por vírgula). O app nativo não envia Origin. */
export function allowedOrigins(): string[] | '*' {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return '*';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}
