// Implementacao concreta: Mercado Pago.
// Verificacao da assinatura conforme o header x-signature (ts + v1 HMAC-SHA256
// sobre "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"), usando o segredo
// do webhook. Depois, confirma o estado real consultando a API do MP com o
// access token; nunca confia apenas no corpo recebido.
import type { NormalizedEvent, NormalizedStatus, PaymentGateway } from './types.ts';

const WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET') ?? '';
const ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';

function mapStatus(s: string): NormalizedStatus {
  switch (s) {
    case 'approved':
    case 'authorized':
      return 'confirmed';
    case 'pending':
    case 'in_process':
      return 'pending';
    case 'refunded':
      return 'refunded';
    case 'charged_back':
      return 'chargeback';
    case 'cancelled':
      return 'canceled';
    default:
      return 'failed';
  }
}

function mapMethod(t: string | undefined): NormalizedEvent['method'] {
  if (!t) return 'outro';
  if (t === 'pix' || t === 'bank_transfer') return 'pix';
  if (t === 'credit_card' || t === 'debit_card') return 'card';
  if (t === 'ticket' || t === 'boleto') return 'boleto';
  return 'outro';
}

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

// Comparacao em tempo constante para nao vazar a assinatura por timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export class MercadoPagoGateway implements PaymentGateway {
  readonly provider = 'mercado_pago' as const;

  async verify(req: Request, _rawBody: string): Promise<boolean> {
    if (!WEBHOOK_SECRET) return false;
    const sigHeader = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id') ?? '';
    if (!sigHeader) return false;

    // x-signature: "ts=1699999999,v1=abcdef..."
    const parts = Object.fromEntries(
      sigHeader.split(',').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string]),
    );
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return false;

    const dataId = new URL(req.url).searchParams.get('data.id') ?? '';
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = await hmacHex(WEBHOOK_SECRET, manifest);
    return safeEqual(expected, v1);
  }

  async parse(rawBody: string, _headers: Headers): Promise<NormalizedEvent> {
    const body = JSON.parse(rawBody) as {
      id?: string | number;
      type?: string;
      action?: string;
      data?: { id?: string | number };
    };
    const topic = body.type ?? '';
    const resourceId = String(body.data?.id ?? '');
    // eventId = id do evento quando existir, senao combina topic + recurso.
    const eventId = String(body.id ?? `${topic}:${resourceId}:${body.action ?? ''}`);

    // Assinatura recorrente (preapproval).
    if (topic.startsWith('subscription') || topic === 'preapproval') {
      const sub = await this.fetchJson(`/preapproval/${resourceId}`);
      return {
        provider: this.provider,
        eventId,
        kind: 'subscription',
        status: mapStatus(String(sub?.status ?? '')),
        gatewaySubscriptionId: resourceId,
        externalReference: sub?.external_reference,
        amountCents: sub?.auto_recurring?.transaction_amount
          ? Math.round(Number(sub.auto_recurring.transaction_amount) * 100)
          : undefined,
        currency: sub?.auto_recurring?.currency_id ?? 'BRL',
        raw: { topic, status: sub?.status },
      };
    }

    // Pagamento avulso.
    const pay = await this.fetchJson(`/v1/payments/${resourceId}`);
    return {
      provider: this.provider,
      eventId,
      kind: 'payment',
      status: mapStatus(String(pay?.status ?? '')),
      gatewayPaymentId: resourceId,
      gatewayOrderId: pay?.order?.id ? String(pay.order.id) : undefined,
      externalReference: pay?.external_reference,
      amountCents: pay?.transaction_amount ? Math.round(Number(pay.transaction_amount) * 100) : undefined,
      currency: pay?.currency_id ?? 'BRL',
      method: mapMethod(pay?.payment_type_id),
      // Apenas metadados nao sensiveis. Nada de dados de cartao.
      raw: { status: pay?.status, status_detail: pay?.status_detail, payment_type: pay?.payment_type_id },
    };
  }

  // Consulta a API do MP para confirmar o estado real do recurso.
  private async fetchJson(path: string): Promise<any> {
    const res = await fetch(`https://api.mercadopago.com${path}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    if (!res.ok) throw new Error(`MP API ${path} -> ${res.status}`);
    return res.json();
  }
}
