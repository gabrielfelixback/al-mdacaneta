# Backend Alem da Caneta (Supabase)

Backend do MVP: Postgres com RLS, Auth, Storage privado e Edge Functions em
Deno/TypeScript. Cobre quatro dominios: identidade e jornada (PRE/DURANTE/POS),
trackers de saude, entrega protegida do curso e pagamentos/assinatura via
gateway abstrato (Mercado Pago concreto, Stripe plugavel).

Regra central: o sistema nunca calcula, recomenda, ajusta ou versiona dose de
medicamento. Medicacao em uso e dado bruto, opcional, informado pelo usuario.

## Estrutura

```
backend/
  .env.example
  supabase/
    migrations/
      0001_schema.sql             tabelas, enums, comentarios, indices
      0002_rls.sql                RLS ligada em tudo + policies por tabela
      0003_functions_triggers.sql funcoes, triggers e views de tendencia
    seed.sql                      produtos e 5 modulos (bonus libera no 7o dia)
    functions/
      _shared/                    clientes supabase, cors, gateway
        gateway/                  types, mercadopago, stripe, fabrica
      journey/                    estado + transicoes datadas
      trackers/                   sintomas, proteina, treino, medidas
      module-access/              regra do 7o dia + link assinado
      payments-webhook/           idempotencia + concessao de acesso
      lgpd/                       consentimento, exportacao e exclusao
```

## Subir

```bash
# 1) Banco (na ordem dos arquivos)
supabase db push          # aplica migrations
psql "$DATABASE_URL" -f supabase/seed.sql

# 2) Storage: bucket privado para os PDFs
#    (Studio > Storage > New bucket "curso", NAO publico)

# 3) Segredos (nunca no codigo)
supabase secrets set --env-file backend/.env

# 4) Edge Functions
supabase functions deploy journey trackers module-access lgpd
supabase functions deploy payments-webhook --no-verify-jwt   # gateway nao tem JWT
```

## Endpoints

| Funcao | Metodo | Uso |
| --- | --- | --- |
| journey | GET | estado atual + historico datado |
| journey | POST `{ to, note }` | registra transicao PRE/DURANTE/POS |
| trackers | GET `?type=&from=&to=` | leitura dos proprios registros |
| trackers | POST `{ type, ... }` | cria registro de sintoma/proteina/treino/medida |
| module-access | GET | modulos com estado (liberado/agendado/bloqueado) |
| module-access | POST `{ code }` | link assinado do PDF, se liberado |
| payments-webhook | POST `?provider=` | webhook do gateway (assinado) |
| lgpd | GET `?action=export` | exporta todos os dados do titular |
| lgpd | POST `{ action: 'consent', ... }` | registra consentimento/retirada |
| lgpd | POST `{ action: 'delete', confirm: true }` | exclui conta e dados |

## Seguranca

- RLS ligada em todas as tabelas; o cliente so acessa os proprios dados.
- Financeiro e entitlements: leitura do dono, escrita so pelo backend (service_role).
- `webhook_events` sem policy: inacessivel a qualquer papel do cliente.
- service_role isolada do app; segredos via Supabase Secrets, nunca no codigo.
- Webhook verificado por assinatura antes de qualquer escrita; idempotencia por `unique(gateway, event_id)`.
- Sem dados de cartao no banco; `payments.raw` guarda apenas metadados nao sensiveis.
- Auditoria minimizada: registra acao e referencia, nunca conteudo sensivel.
