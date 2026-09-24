import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { z } from 'zod';

import { allowedOrigins, rateLimit, requireAppKey } from './guard';

// Lê ANTHROPIC_API_KEY do ambiente.
const client = new Anthropic();

const MealAnalysis = z.object({
  is_food: z.boolean().describe('false se a foto não mostra comida ou bebida'),
  items: z.array(
    z.object({
      name: z.string().describe('nome do alimento em português do Brasil'),
      portion: z.string().describe('porção em medida caseira, ex.: "4 col. sopa"'),
      grams: z.number(),
      kcal: z.number(),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
      fiber_g: z.number(),
    }),
  ),
  confidence: z.enum(['baixa', 'media', 'alta']),
  tip: z
    .string()
    .describe('uma frase curta e prática sobre a refeição, com foco em proteína; sem julgamento'),
});

const SYSTEM = `Você estima a composição nutricional de refeições a partir de fotos para um app brasileiro de acompanhamento de quem usa medicamentos GLP-1 (como tirzepatida e semaglutida).

Como estimar:
- Identifique cada alimento visível separadamente e estime a porção em gramas usando referências da cena (prato, talheres, copo, mão).
- Use valores de referência da Tabela Brasileira de Composição de Alimentos (TACO) quando existir equivalente; caso contrário, valores típicos de rótulo.
- Considere o preparo aparente (frito, grelhado, com molho) nas calorias e na gordura.
- Pessoas em uso de GLP-1 costumam comer porções pequenas; não infle porções.
- Se houver informação extra do usuário, ela tem prioridade sobre o que a foto sugere.

Tom da dica: adulto, acolhedor e claro. Nada de culpa, promessa ou alarmismo. Não comente peso corporal nem medicamento.`;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

const app = new Hono();

const origins = allowedOrigins();
app.use('/api/*', cors({ origin: origins, allowHeaders: ['Content-Type', 'x-app-key'], allowMethods: ['POST', 'OPTIONS'] }));
app.use('/api/*', requireAppKey());

app.get('/health', (c) => c.json({ ok: true }));

app.post('/api/analyze-meal', rateLimit({ max: 20, windowMs: 60 * 60_000 }), bodyLimit({ maxSize: 8 * 1024 * 1024 }), async (c) => {
  const body = await c.req.json<{ image?: string; mediaType?: string; context?: string }>().catch(() => null);
  if (!body?.image) return c.text('Envie a foto em base64 no campo "image".', 400);
  const mediaType = (body.mediaType ?? 'image/jpeg') as AllowedType;
  if (!ALLOWED_TYPES.includes(mediaType)) return c.text('Formato de imagem não suportado.', 400);

  const context = body.context?.trim().slice(0, 500);

  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium', format: betaZodOutputFormat(MealAnalysis) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: body.image } },
            {
              type: 'text',
              text: context
                ? `Estime a composição desta refeição. Informação do usuário: ${context}`
                : 'Estime a composição desta refeição.',
            },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return c.text('Não foi possível analisar esta imagem.', 422);
    }
    if (!response.parsed_output) {
      return c.text('A análise não retornou um resultado válido. Tente outra foto.', 502);
    }
    return c.json(response.parsed_output);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return c.text('Muitas análises ao mesmo tempo. Tente de novo em instantes.', 429);
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Claude API error', err.status, err.message);
      return c.text('Serviço de análise indisponível no momento.', 502);
    }
    console.error(err);
    return c.text('Erro inesperado na análise.', 500);
  }
});

const ASSISTANT_SYSTEM = `Você é o assistente do app Além da Caneta, para adultos que usam medicamentos GLP-1 (tirzepatida, semaglutida e similares). Você ajuda a aplicar o Método 3P no dia a dia:
- P1 · Priorizar proteína: fazer cada garfada contar quando o prato precisa ser pequeno.
- P2 · Planejar refeições pequenas: o que comer, quando e como, mesmo sem vontade; hidratação, fibras e intestino em dia.
- P3 · Preparar a transição: transformar o tratamento em hábitos que ficam quando a caneta sair.

Tom: adulto, acolhedor, claro e técnico. Sem culpa, sem promessas, sem alarmismo, sem emojis. Português do Brasil. Respostas curtas e práticas (até ~150 palavras), com listas quando ajudar. Receitas trazem ingredientes em medidas caseiras e proteína aproximada por porção.

Limites:
- Não indique, ajuste, suspenda nem compare doses de medicamento, e não diga qual medicamento usar. Para isso, oriente a falar com quem prescreveu.
- Não faça diagnóstico. Diante de sinais de alerta (dor abdominal forte e persistente, vômitos que não passam, vários dias sem evacuar com dor ou inchaço, sinais de desidratação, reação alérgica), recomende atendimento médico imediato.
- Não dê orientação a menores de 18 anos, gestantes ou lactantes além de recomendar acompanhamento profissional.
- Não comente o corpo da pessoa nem use números de peso como meta de valor.

Use o contexto do app (metas e registros do dia) quando for relevante, sem repeti-lo por inteiro.`;

app.post('/api/assistant', rateLimit({ max: 60, windowMs: 60 * 60_000 }), bodyLimit({ maxSize: 256 * 1024 }), async (c) => {
  const body = await c.req
    .json<{ messages?: { role: 'user' | 'assistant'; text: string }[]; context?: string }>()
    .catch(() => null);
  const history = (body?.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 4000) }));
  // A conversa precisa começar pela pessoa e terminar numa pergunta dela.
  while (history.length && history[0].role !== 'user') history.shift();
  if (!history.length || history[history.length - 1].role !== 'user') {
    return c.text('Envie a pergunta em "messages".', 400);
  }
  const context = body?.context?.slice(0, 2000);

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: context ? `${ASSISTANT_SYSTEM}\n\nContexto do app:\n${context}` : ASSISTANT_SYSTEM,
      messages: history,
    });
    if (response.stop_reason === 'refusal') {
      return c.json({ text: 'Não consigo ajudar com isso por aqui. Para dúvidas sobre o tratamento, fale com quem te acompanha.' });
    }
    const text = response.content
      .flatMap((b) => (b.type === 'text' ? [b.text] : []))
      .join('\n')
      .trim();
    return c.json({ text: text || 'Não consegui responder agora. Tente reformular a pergunta.' });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return c.text('Muitas perguntas ao mesmo tempo. Tente de novo em instantes.', 429);
    if (err instanceof Anthropic.APIError) {
      console.error('Claude API error', err.status, err.message);
      return c.text('Assistente indisponível no momento.', 502);
    }
    console.error(err);
    return c.text('Erro inesperado no assistente.', 500);
  }
});

if (origins === '*') {
  console.warn('ALLOWED_ORIGINS não definida: qualquer site pode chamar a API pelo navegador. Defina em produção.');
}
if (!process.env.APP_API_KEY) {
  console.warn('APP_API_KEY não definida: a API aceita chamadas sem a chave do app. Defina em produção.');
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY não definida: /api/analyze-meal vai falhar até você configurá-la em server/.env.');
}

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`Além da Caneta API em http://localhost:${port}`);
