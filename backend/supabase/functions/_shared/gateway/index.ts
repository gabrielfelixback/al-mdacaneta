// Fabrica de gateway. O restante do backend pede um PaymentGateway pelo
// nome do provedor e nao conhece detalhes de nenhum deles.
import type { PaymentGateway } from './types.ts';
import { MercadoPagoGateway } from './mercadopago.ts';
import { StripeGateway } from './stripe.ts';

export function makeGateway(provider: 'mercado_pago' | 'stripe'): PaymentGateway {
  switch (provider) {
    case 'mercado_pago':
      return new MercadoPagoGateway();
    case 'stripe':
      return new StripeGateway();
    default:
      throw new Error(`gateway nao suportado: ${provider}`);
  }
}

export type { PaymentGateway, NormalizedEvent } from './types.ts';
