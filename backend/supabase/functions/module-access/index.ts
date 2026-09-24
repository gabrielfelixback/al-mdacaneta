// Edge Function: acesso ao conteudo do curso.
// GET  /module-access            -> lista os modulos com o estado de acesso
//                                   do usuario (liberado, bloqueado, ou
//                                   agendado para o 7o dia do bonus).
// POST /module-access { code }   -> se liberado, devolve um link ASSINADO e
//                                   de curta duracao para o PDF no bucket
//                                   privado 'curso'. Senao, 403 com o motivo.
// A checagem de acesso usa has_module_access (regra do 7o dia embutida). O
// link so e gerado apos a checagem passar; o storage_path nunca vai ao app
// sem entitlement valido.
import { getUser, userClient, serviceClient } from '../_shared/supabase.ts';
import { handleOptions, json } from '../_shared/cors.ts';

const BUCKET = 'curso';
const SIGNED_TTL = 300; // 5 minutos

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  const origin = req.headers.get('origin');

  const user = await getUser(req);
  if (!user) return json({ error: 'nao autenticado' }, 401, origin);
  const db = userClient(req);

  // Lista de modulos + estado de acesso (calculado a partir dos entitlements
  // do proprio usuario, que a RLS ja restringe).
  if (req.method === 'GET') {
    const [{ data: modules }, { data: ents }] = await Promise.all([
      db.from('modules').select('id, code, title, order_index, is_bonus, unlock_delay_days')
        .order('order_index', { ascending: true }),
      db.from('entitlements').select('module_id, granted_at, unlock_at, revoked_at'),
    ]);
    const byModule = new Map((ents ?? []).map((e) => [e.module_id, e]));
    const now = Date.now();

    const items = (modules ?? []).map((m) => {
      const e = byModule.get(m.id);
      let status: 'liberado' | 'bloqueado' | 'agendado' = 'bloqueado';
      let unlock_at: string | null = null;
      if (e && !e.revoked_at) {
        if (!e.unlock_at || now >= new Date(e.unlock_at).getTime()) status = 'liberado';
        else { status = 'agendado'; unlock_at = e.unlock_at; }
      }
      return { code: m.code, title: m.title, is_bonus: m.is_bonus, status, unlock_at };
    });
    return json({ items }, 200, origin);
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null) as { code?: string } | null;
    const code = body?.code;
    if (!code) return json({ error: 'informe o code do modulo' }, 400, origin);

    const { data: mod } = await db.from('modules').select('id, storage_path, title').eq('code', code).single();
    if (!mod) return json({ error: 'modulo inexistente' }, 404, origin);

    // Regra do 7o dia + entitlement valido, tudo dentro da funcao SQL.
    const { data: allowed, error: accErr } = await db.rpc('has_module_access', { p_module: mod.id });
    if (accErr) return json({ error: 'falha ao checar acesso' }, 400, origin);
    if (!allowed) {
      // Descobre o motivo para uma mensagem util (bloqueado x agendado).
      const { data: e } = await db.from('entitlements')
        .select('unlock_at, revoked_at').eq('module_id', mod.id).maybeSingle();
      const scheduled = e && !e.revoked_at && e.unlock_at;
      return json(
        scheduled
          ? { error: 'ainda nao liberado', unlock_at: e!.unlock_at }
          : { error: 'sem acesso a este modulo' },
        403, origin,
      );
    }

    // Link assinado gerado com service_role (Storage exige privilegio).
    // So chegamos aqui apos a checagem de acesso passar.
    const admin = serviceClient();
    const { data: signed, error: sErr } = await admin.storage
      .from(BUCKET).createSignedUrl(mod.storage_path, SIGNED_TTL);
    if (sErr || !signed) return json({ error: 'falha ao gerar link' }, 502, origin);

    // Auditoria de acesso (minimizada: so a referencia do modulo).
    await admin.from('audit_log').insert({
      user_id: user.id, actor: 'user', action: 'access', entity: 'modules', entity_id: mod.id,
    });

    return json({ url: signed.signedUrl, title: mod.title, expires_in: SIGNED_TTL }, 200, origin);
  }

  return json({ error: 'metodo nao suportado' }, 405, origin);
});
