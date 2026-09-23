import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { z } from 'zod';

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

app.use('/api/*', cors());

app.get('/health', (c) => c.json({ ok: true }));

app.post('/api/analyze-meal', bodyLimit({ maxSize: 8 * 1024 * 1024 }), async (c) => {
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

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY não definida: /api/analyze-meal vai falhar até você configurá-la em server/.env.');
}

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`Além da Caneta API em http://localhost:${port}`);
