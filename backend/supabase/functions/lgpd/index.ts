// Edge Function: direitos do titular (LGPD).
// POST /lgpd { action: 'consent', consent_type, granted, version }
//        -> registra consentimento/retirada (append-only), com IP e user agent.
// GET  /lgpd?action=export
//        -> exporta TODOS os dados pessoais do usuario num JSON (direito de acesso).
// POST /lgpd { action: 'delete', confirm: true }
//        -> abre pedido de exclusao e executa a remocao dos dados pessoais.
//
// Portabilidade e acesso rodam no contexto do usuario (RLS). A exclusao
// registra o pedido, roda com service_role para apagar em todas as tabelas
// e por fim remove a conta em auth.users (cascata limpa o resto).
import { getUser, userClient, serviceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';

const CONSENT_TYPES = ['termos_de_uso', 'politica_privacidade', 'dados_saude', 'marketing'];

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;
  const origin = req.headers.get('origin');

  const user = await getUser(req);
  if (!user) return json({ error: 'nao autenticado' }, 401, origin);
  const db = userClient(req);

  // ---- Exportacao (direito de acesso e portabilidade) ----
  if (req.method === 'GET' && new URL(req.url).searchParams.get('action') === 'export') {
    const tables = [
      'profiles', 'journey_transitions', 'user_medications', 'symptom_logs',
      'protein_logs', 'training_sessions', 'body_measurements',
      'purchases', 'purchase_items', 'subscriptions', 'payments', 'entitlements',
      'consents', 'audit_log', 'data_deletion_requests',
    ];
    const dump: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: user.id };
    for (const t of tables) {
      const { data } = await db.from(t).select('*'); // RLS ja restringe ao dono
      dump[t] = data ?? [];
    }
    // Auditoria do proprio acesso (minimizada).
    await db.from('audit_log').insert({ user_id: user.id, actor: 'user', action: 'export', entity: 'account' })
      .then(() => {}, () => {});
    return new Response(JSON.stringify(dump, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="meus-dados-alem-da-caneta.json"',
        ...corsHeaders(origin),
      },
    });
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null) as
      | { action?: string; consent_type?: string; granted?: boolean; version?: string; confirm?: boolean }
      | null;
    const action = body?.action;

    // ---- Consentimento (append-only) ----
    if (action === 'consent') {
      if (!body?.consent_type || !CONSENT_TYPES.includes(body.consent_type)) {
        return json({ error: 'consent_type invalido' }, 400, origin);
      }
      if (typeof body.granted !== 'boolean' || !body.version) {
        return json({ error: 'informe granted (bool) e version' }, 400, origin);
      }
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
      const ua = req.headers.get('user-agent')?.slice(0, 300) ?? null;
      const { data, error } = await db.from('consents').insert({
        user_id: user.id, consent_type: body.consent_type, granted: body.granted,
        version: body.version, ip, user_agent: ua,
      }).select().single();
      if (error) return json({ error: 'falha ao registrar consentimento' }, 400, origin);
      return json({ consent: data }, 201, origin);
    }

    // ---- Exclusao de conta e dados ----
    if (action === 'delete') {
      if (body?.confirm !== true) {
        return json({ error: 'envie confirm: true para excluir a conta e os dados' }, 400, origin);
      }
      const admin = serviceClient();

      // Registra o pedido (prova de atendimento) antes de executar.
      const { data: reqRow } = await admin.from('data_deletion_requests')
        .insert({ user_id: user.id, status: 'processing' }).select().single();

      // Apaga dados pessoais. As tabelas com FK on delete cascade a partir de
      // profiles/auth.users somem junto; ainda assim limpamos o financeiro
      // (que usa on delete restrict) de forma explicita e auditamos antes.
      await admin.from('audit_log').insert({
        user_id: user.id, actor: 'user', action: 'deletion_requested',
        entity: 'account', entity_id: user.id,
      });

      // Remove entitlements e espelhos financeiros ligados ao usuario.
      await admin.from('entitlements').delete().eq('user_id', user.id);
      await admin.from('payments').delete().or(
        `purchase_id.in.(${await ids(admin, 'purchases', user.id)}),subscription_id.in.(${await ids(admin, 'subscriptions', user.id)})`,
      ).then(() => {}, () => {});
      await admin.from('purchase_items').delete().in('purchase_id', (await listIds(admin, 'purchases', user.id)));
      await admin.from('subscriptions').delete().eq('user_id', user.id);
      await admin.from('purchases').delete().eq('user_id', user.id);

      // Remove a conta de auth: a cascata a partir de profiles limpa perfil,
      // jornada, trackers e consentimentos. audit_log e deletion_requests usam
      // on delete set null, entao a prova de atendimento permanece anonima.
      await admin.auth.admin.deleteUser(user.id);

      await admin.from('data_deletion_requests')
        .update({ status: 'done', executed_at: new Date().toISOString() })
        .eq('id', reqRow?.id ?? '');
      await admin.from('audit_log').insert({
        actor: 'system', action: 'deletion_executed', entity: 'account', entity_id: user.id,
      });

      return json({ status: 'excluido' }, 200, origin);
    }

    return json({ error: 'action deve ser consent ou delete' }, 400, origin);
  }

  return json({ error: 'metodo nao suportado' }, 405, origin);
});

// Helpers para montar as listas de ids do financeiro do usuario.
async function listIds(db: ReturnType<typeof serviceClient>, table: string, userId: string): Promise<string[]> {
  const { data } = await db.from(table).select('id').eq('user_id', userId);
  return (data ?? []).map((r: { id: string }) => r.id);
}
async function ids(db: ReturnType<typeof serviceClient>, table: string, userId: string): Promise<string> {
  const list = await listIds(db, table, userId);
  return list.length ? list.join(',') : '00000000-0000-0000-0000-000000000000';
}
