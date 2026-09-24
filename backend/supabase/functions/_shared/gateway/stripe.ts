// Implementacao concreta: Stripe (plugavel, pronta para ligar depois).
// A verificacao usa o header Stripe-Signature (t + v1, HMAC-SHA256 sobre
// "<t>.<payload>") com o webhook signing secret. O parse traduz os eventos
// mais comuns para o vocabulario interno. Fica como segunda opcao; o MVP
// pode subir so com Mercado Pago e ligar o Stripe sem tocar no nucleo.
import type { NormalizedEvent, NormalizedStatus, PaymentGateway } from './types.ts';

const SIGNING_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const TOLERANCE_SEC = 300; // rejeita eventos muito antigos (replay)

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function mapStatus(evtType: string): NormalizedStatus {
  if (evtType.includes('refund')) return 'refunded';
  if (evtType.includes('dispute')) return 'chargeback';
  if (evtType.endsWith('.succeeded') || evtType.endsWith('.paid')) return 'confirmed';
  if (evtType.endsWith('.payment_failed') || evtType.endsWith('.failed')) return 'failed';
  if (evtType.includes('deleted') || evtType.includes('canceled')) return 'canceled';
  return 'pending';
}

export class StripeGateway implements PaymentGateway {
  readonly provider = 'stripe' as const;

  async verify(req: Request, rawBody: string): Promise<boolean> {
    if (!SIGNING_SECRET) return false;
    const header = req.headers.get('Stripe-Signature');
    if (!header) return false;
    const parts = Object.fromEntries(
      header.split(',').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string]),
    );
    const t = parts['t'];
    const v1 = parts['v1'];
    if (!t || !v1) return false;
    if (Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCE_SEC) return false;
    const expected = await hmacHex(SIGNING_SECRET, `${t}.${rawBody}`);
    return safeEqual(expected, v1);
  }

  async parse(rawBody: string, _headers: Headers): Promise<NormalizedEvent> {
    const evt = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: { object: Record<string, any> };
    };
    const obj = evt.data.object ?? {};
    const isSub = evt.type.startsWith('customer.subscription') || evt.type.startsWith('invoice');
    return {
      provider: this.provider,
      eventId: evt.id,
      kind: isSub ? 'subscription' : 'payment',
      status: mapStatus(evt.type),
      gatewayPaymentId: obj.payment_intent ?? obj.id,
      gatewaySubscriptionId: isSub ? (obj.subscription ?? obj.id) : undefined,
      externalReference: obj.metadata?.external_reference ?? obj.client_reference_id,
      amountCents: typeof obj.amount === 'number' ? obj.amount : obj.amount_paid,
      currency: (obj.currency ?? 'brl').toUpperCase(),
      method: 'card',
      raw: { type: evt.type, status: obj.status },
    };
  }
}
