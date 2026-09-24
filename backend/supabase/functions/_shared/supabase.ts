// Clientes Supabase para as Edge Functions.
// - userClient: usa o JWT do chamador; TODAS as queries respeitam a RLS.
// - serviceClient: usa a service_role; IGNORA a RLS. Nunca exponha a
//   service_role ao app. Use apenas para operacoes de backend confiaveis
//   (webhooks de pagamento, execucao de exclusao, links assinados).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Cliente no contexto do usuario. Repassa o header Authorization recebido,
// entao auth.uid() dentro do banco resolve para o usuario logado.
export function userClient(req: Request): SupabaseClient {
  const authorization = req.headers.get('Authorization') ?? '';
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Cliente com service_role. Mantenha isolado do cliente do app.
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Resolve o usuario a partir do JWT. Retorna null se ausente ou invalido.
export async function getUser(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const admin = serviceClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
