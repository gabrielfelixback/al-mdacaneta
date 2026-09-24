// Edge Function: jornada PRE/DURANTE/POS.
// GET  -> estado atual + historico datado do usuario.
// POST -> registra uma transicao (chama record_journey_transition, que
//         atualiza o perfil e grava o historico de forma atomica).
// Toda a autorizacao vem da RLS + auth.uid(); a funcao roda no contexto do
// usuario (userClient), nunca com service_role.
import { getUser, userClient } from '../_shared/supabase.ts';
import { handleOptions, json } from '../_shared/cors.ts';

const STATES = ['pre', 'durante', 'pos'] as const;
type State = (typeof STATES)[number];

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  const origin = req.headers.get('origin');

  const user = await getUser(req);
  if (!user) return json({ error: 'nao autenticado' }, 401, origin);

  const db = userClient(req);

  if (req.method === 'GET') {
    const [{ data: profile }, { data: history }] = await Promise.all([
      db.from('profiles').select('current_journey_state').eq('id', user.id).single(),
      db.from('journey_transitions').select('id, from_state, to_state, changed_at, note')
        .order('changed_at', { ascending: false }).limit(50),
    ]);
    return json({ current: profile?.current_journey_state ?? 'pre', history: history ?? [] }, 200, origin);
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null) as { to?: string; note?: string } | null;
    const to = body?.to;
    if (!to || !STATES.includes(to as State)) {
      return json({ error: 'campo "to" deve ser pre, durante ou pos' }, 400, origin);
    }
    const note = typeof body?.note === 'string' ? body.note.slice(0, 500) : null;

    // A funcao SQL confirma o usuario, atualiza o estado e grava o historico.
    const { data, error } = await db.rpc('record_journey_transition', { p_to: to, p_note: note });
    if (error) return json({ error: 'nao foi possivel registrar a transicao' }, 400, origin);
    return json({ transition: data }, 200, origin);
  }

  return json({ error: 'metodo nao suportado' }, 405, origin);
});
