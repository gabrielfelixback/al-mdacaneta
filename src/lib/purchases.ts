// Assinatura Pro. A cobrança real (App Store / Google Play) entra com RevenueCat;
// até lá, em desenvolvimento o botão ativa um modo de teste sem cobrança.
import type { ProState } from '@/store/types';

export interface Plan {
  id: 'mensal' | 'anual';
  label: string;
  price: string;
  detail: string;
  badge?: string;
}

// Valores provisórios: definir com o time comercial.
export const PLANS: Plan[] = [
  { id: 'anual', label: 'Anual', price: 'R$ 119,90/ano', detail: 'equivale a R$ 9,99 por mês', badge: 'melhor valor' },
  { id: 'mensal', label: 'Mensal', price: 'R$ 19,90/mês', detail: 'cancele quando quiser' },
];

export const BILLING_READY = false;

/** Builds de teste (EXPO_PUBLIC_TEST_MODE=1) liberam o Pro sem cobrança para quem está testando. */
export const TEST_MODE = __DEV__ || process.env.EXPO_PUBLIC_TEST_MODE === '1';

export class BillingNotReadyError extends Error {
  constructor() {
    super('Pagamentos ainda não estão disponíveis nesta versão.');
  }
}

function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export async function purchase(plan: Plan['id']): Promise<ProState> {
  if (!BILLING_READY && !TEST_MODE) throw new BillingNotReadyError();
  const now = new Date();
  return {
    active: true,
    plan,
    since: now.toISOString(),
    renewsAt: addMonths(now, plan === 'anual' ? 12 : 1).toISOString(),
  };
}

/** Quem comprou o Método 3P na página de vendas resgata o acesso com o código do e-mail. */
export async function redeemCode(code: string): Promise<ProState> {
  if (!code.trim()) throw new Error('Digite o código recebido por e-mail.');
  if (!BILLING_READY && !TEST_MODE) throw new BillingNotReadyError();
  const now = new Date();
  return { active: true, plan: 'metodo3p', since: now.toISOString(), renewsAt: addMonths(now, 12).toISOString() };
}
