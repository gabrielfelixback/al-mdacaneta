// Abstracao de gateway de pagamento. O nucleo do sistema so conhece esta
// interface; trocar Mercado Pago por Stripe (ou somar os dois) nao mexe na
// logica de liberacao de acesso, so na implementacao concreta.

export type NormalizedKind =
  | 'payment'        // pagamento avulso (curso)
  | 'subscription'   // ciclo de assinatura
  | 'refund'
  | 'chargeback'
  | 'unknown';

export type NormalizedStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'refunded'
  | 'chargeback'
  | 'canceled';

// Evento ja traduzido para o vocabulario interno, sem termos do gateway.
export interface NormalizedEvent {
  provider: 'mercado_pago' | 'stripe';
  eventId: string;                 // id unico do evento no gateway (idempotencia)
  kind: NormalizedKind;
  status: NormalizedStatus;
  // Referencias do gateway; usadas para casar com purchases/subscriptions.
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySubscriptionId?: string;
  // external_reference que enviamos no checkout: normalmente o purchase.id
  // ou o user.id. Nunca confie so nele; valide contra o gateway.
  externalReference?: string;
  amountCents?: number;
  currency?: string;
  method?: 'pix' | 'card' | 'boleto' | 'outro';
  // Metadados NAO sensiveis para auditoria/idempotencia. Sem dados de cartao.
  raw: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly provider: 'mercado_pago' | 'stripe';

  // Verifica a autenticidade do webhook (assinatura/HMAC). Lanca ou retorna
  // false se invalido. Nenhuma escrita deve ocorrer antes desta checagem.
  verify(req: Request, rawBody: string): Promise<boolean>;

  // Traduz o corpo do webhook para um NormalizedEvent. Quando o webhook so
  // traz um id, a implementacao consulta a API do gateway para confirmar o
  // estado real (nunca confiar apenas no payload recebido).
  parse(rawBody: string, headers: Headers): Promise<NormalizedEvent>;
}
