// Edge Function: trackers (sintomas, proteina, treino, medidas).
// GET  /trackers?type=symptom|protein|training|measurement[&from=&to=]
//      -> leitura dos proprios registros no periodo.
// POST /trackers  { type, ...campos } -> cria um registro.
// A RLS garante que so o dono acessa; o user_id vem do JWT, nunca do corpo.
// Nada aqui calcula dose nem impoe meta: proteina e apoio, a faixa de
// referencia (1,2 a 1,6 g/kg/dia) e informativa e fica no app, nao no banco.
import { getUser, userClient } from '../_shared/supabase.ts';
import { handleOptions, json } from '../_shared/cors.ts';

type Tracker = 'symptom' | 'protein' | 'training' | 'measurement';

const TABLE: Record<Tracker, string> = {
  symptom: 'symptom_logs',
  protein: 'protein_logs',
  training: 'training_sessions',
  measurement: 'body_measurements',
};

const TIME_COL: Record<Tracker, string> = {
  symptom: 'logged_at',
  protein: 'logged_on',
  training: 'performed_at',
  measurement: 'measured_on',
};

// Whitelist de campos aceitos por tracker. Qualquer chave fora disso e
// ignorada; user_id nunca vem do cliente.
const FIELDS: Record<Tracker, string[]> = {
  symptom: ['logged_at', 'kind', 'custom_label', 'severity', 'note'],
  protein: ['logged_on', 'grams', 'source_note'],
  training: ['performed_at', 'type', 'duration_min', 'intensity', 'note'],
  measurement: ['measured_on', 'waist_cm', 'hip_cm', 'arm_cm', 'thigh_cm', 'weight_kg', 'note'],
};

function pick(obj: Record<string, unknown>, allowed: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of allowed) if (obj[k] !== undefined && obj[k] !== null) out[k] = obj[k];
  return out;
}

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  const origin = req.headers.get('origin');

  const user = await getUser(req);
  if (!user) return json({ error: 'nao autenticado' }, 401, origin);
  const db = userClient(req);

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') as Tracker | null;
    if (!type || !TABLE[type]) return json({ error: 'type invalido' }, 400, origin);

    let q = db.from(TABLE[type]).select('*').order(TIME_COL[type], { ascending: false }).limit(365);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    if (from) q = q.gte(TIME_COL[type], from);
    if (to) q = q.lte(TIME_COL[type], to);

    const { data, error } = await q;
    if (error) return json({ error: 'falha na leitura' }, 400, origin);
    return json({ items: data ?? [] }, 200, origin);
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null) as (Record<string, unknown> & { type?: Tracker }) | null;
    const type = body?.type as Tracker | undefined;
    if (!type || !TABLE[type]) return json({ error: 'type invalido' }, 400, origin);

    const row = { ...pick(body!, FIELDS[type]), user_id: user.id };
    const { data, error } = await db.from(TABLE[type]).insert(row).select().single();
    // Erro de check/constraint vira 400 sem vazar detalhe interno.
    if (error) return json({ error: 'nao foi possivel salvar o registro' }, 400, origin);
    return json({ item: data }, 201, origin);
  }

  return json({ error: 'metodo nao suportado' }, 405, origin);
});
