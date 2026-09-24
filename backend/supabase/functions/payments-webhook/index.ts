// Edge Function: webhook de pagamento.
// Recebe eventos do gateway (Mercado Pago por padrao; Stripe plugavel),
// verifica a assinatura, normaliza o evento, garante idempotencia via
// webhook_events e, quando o pagamento e confirmado, concede os
// entitlements. O bonus "Manutencao Blindada" recebe unlock_at =
// confirmado + 7 dias (a liberacao efetiva acontece no 7o dia).
//
// Esta funcao NAO exige JWT de usuario (o gateway nao tem sessao). A
// autenticacao e a assinatura do webhook. Deve ser publicada com
// --no-verify-jwt e roda com service_role para escrever no financeiro.
import { serviceClient } from '../_shared/supabase.ts';
import { makeGateway, type NormalizedEvent } from '../_shared/gateway/index.ts';

// Provider vem da rota (?provider=) para permitir os dois gateways ativos.
function providerFrom(req: Request): 'mercado_pago' | 'stripe' {
  const p = new URL(req.url).searchParams.get('provider');
  return p === 'stripe' ? 'stripe' : 'mercado_pago';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('metodo nao suportado', { status: 405 });

  const provider = providerFrom(req);
  const gateway = makeGateway(provider);
  const rawBody = await req.text();

  // 1) Verificacao de assinatura ANTES de qualquer escrita.
  const ok = await gateway.verify(req, rawBody).catch(() => false);
  if (!ok) return new Response('assinatura invalida', { status: 401 });

  // 2) Normaliza (consultando a API do gateway para confirmar o estado real).
  let evt: NormalizedEvent;
  try {
    evt = await gateway.parse(rawBody, req.headers);
  } catch (_e) {
    return new Response('payload invalido', { status: 400 });
  }

  const db = serviceClient();

  // 3) Idempotencia: registra o evento; se ja existia, encerra sem reprocessar.
  const { error: insErr } = await db.from('webhook_events').insert({
    gateway: provider, event_id: evt.eventId, type: evt.kind, payload: evt.raw,
  });
  if (insErr) {
    // Violacao de unique(gateway,event_id) => evento repetido. Idempotente.
    if ((insErr as { code?: string }).code === '23505') return new Response('ok (duplicado)', { status: 200 });
    return new Response('falha ao registrar evento', { status: 500 });
  }

  try {
    await processEvent(db, evt);
    await db.from('webhook_events').update({ processed_at: new Date().toISOString() })
      .eq('gateway', provider).eq('event_id', evt.eventId);
    return new Response('ok', { status: 200 });
  } catch (e) {
    // Guarda o erro e devolve 500 para o gateway reenviar depois.
    await db.from('webhook_events').update({ error: String(e).slice(0, 500) })
      .eq('gateway', provider).eq('event_id', evt.eventId);
    return new Response('erro ao processar', { status: 500 });
  }
});

async function processEvent(db: ReturnType<typeof serviceClient>, evt: NormalizedEvent) {
  // Descobre o usuario pela external_reference (enviada no checkout).
  const userId = evt.externalReference ?? null;

  // Registra a transacao de pagamento (sem dado de cartao).
  await db.from('payments').insert({
    gateway: evt.provider,
    gateway_payment_id: evt.gatewayPaymentId ?? null,
    status: evt.status,
    amount_cents: evt.amountCents ?? 0,
    method: evt.method ?? 'outro',
    raw: evt.raw,
  }).select().maybeSingle();

  // So concede acesso quando confirmado.
  if (evt.status !== 'confirmed' || !userId) {
    if (evt.status === 'refunded' || evt.status === 'chargeback' || evt.status === 'canceled') {
      await revokeAccess(db, userId, evt);
    }
    return;
  }

  if (evt.kind === 'payment') {
    await grantCourseAccess(db, userId, evt);
  } else if (evt.kind === 'subscription') {
    await upsertSubscription(db, userId, evt);
  }
}

// Pagamento do curso confirmado: registra o pedido e concede TODOS os
// modulos do produto. Bonus ganha unlock_at = agora + unlock_delay_days.
async function grantCourseAccess(db: ReturnType<typeof serviceClient>, userId: string, evt: NormalizedEvent) {
  const confirmedAt = new Date();

  // Pedido (idempotente pela unique do gateway_order_id quando houver).
  const { data: purchase } = await db.from('purchases').upsert({
    user_id: userId,
    gateway: evt.provider,
    gateway_order_id: evt.gatewayOrderId ?? evt.gatewayPaymentId ?? evt.eventId,
    status: 'confirmed',
    total_cents: evt.amountCents ?? 0,
    currency: evt.currency ?? 'BRL',
    confirmed_at: confirmedAt.toISOString(),
  }, { onConflict: 'gateway,gateway_order_id' }).select().single();

  // Modulos do produto principal (Metodo 3P).
  const { data: modules } = await db.from('modules')
    .select('id, unlock_delay_days')
    .in('product_id', [
      (await db.from('products').select('id').eq('slug', 'metodo-3p').single()).data?.id,
    ]);

  const rows = (modules ?? []).map((m) => ({
    user_id: userId,
    module_id: m.id,
    source: 'purchase' as const,
    purchase_id: purchase?.id ?? null,
    unlock_at: m.unlock_delay_days > 0
      ? new Date(confirmedAt.getTime() + m.unlock_delay_days * 86400_000).toISOString()
      : null,
    revoked_at: null,
  }));

  if (rows.length) {
    // onConflict(user,module): reconcede sem duplicar; limpa revogacao anterior.
    await db.from('entitlements').upsert(rows, { onConflict: 'user_id,module_id' });
  }

  await db.from('audit_log').insert({
    user_id: userId, actor: 'system', action: 'entitlement_granted',
    entity: 'purchases', entity_id: purchase?.id ?? null,
    meta: { modules: rows.length },
  });
}

// Ciclo de assinatura confirmado: espelha o estado da assinatura.
async function upsertSubscription(db: ReturnType<typeof serviceClient>, userId: string, evt: NormalizedEvent) {
  await db.from('subscriptions').upsert({
    user_id: userId,
    gateway: evt.provider,
    gateway_subscription_id: evt.gatewaySubscriptionId ?? evt.eventId,
    status: 'active',
  }, { onConflict: 'gateway,gateway_subscription_id' });

  await db.from('audit_log').insert({
    user_id: userId, actor: 'system', action: 'payment_event',
    entity: 'subscriptions', entity_id: evt.gatewaySubscriptionId ?? null,
    meta: { status: evt.status },
  });
}

// Reembolso/chargeback/cancelamento: revoga o acesso concedido.
async function revokeAccess(db: ReturnType<typeof serviceClient>, userId: string | null, evt: NormalizedEvent) {
  if (!userId) return;
  if (evt.kind === 'subscription') {
    await db.from('subscriptions').update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('user_id', userId).eq('gateway_subscription_id', evt.gatewaySubscriptionId ?? '');
  } else {
    await db.from('entitlements').update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId).eq('source', 'purchase');
  }
  await db.from('audit_log').insert({
    user_id: userId, actor: 'system', action: 'entitlement_revoked',
    entity: 'payments', entity_id: evt.gatewayPaymentId ?? null, meta: { status: evt.status },
  });
}
