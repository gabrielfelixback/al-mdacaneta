-- =====================================================================
-- Alem da Caneta - Schema do MVP (Postgres / Supabase)
-- Regra de negocio central: o sistema NUNCA calcula, recomenda, ajusta
-- ou versiona dose de medicamento. Medicacao em uso e dado bruto,
-- opcional, informado pelo usuario. Nada alem disso.
-- =====================================================================

create extension if not exists "pgcrypto";     -- gen_random_uuid
create extension if not exists "citext";        -- email/codigos case-insensitive

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type journey_state       as enum ('pre', 'durante', 'pos');
create type symptom_kind        as enum ('nausea','constipacao','refluxo','cansaco','queda_cabelo','tontura','dor_cabeca','inchaco','diarreia','reacao_local','outro');
create type training_type       as enum ('forca','cardio','mobilidade','outro');
create type intensity_level     as enum ('leve','moderado','intenso');
create type payment_status      as enum ('pending','confirmed','failed','refunded','chargeback','canceled');
create type subscription_status as enum ('active','trialing','past_due','canceled','paused');
create type gateway_provider    as enum ('mercado_pago','stripe');
create type purchase_item_type  as enum ('main','order_bump','upsell','subscription');
create type entitlement_source  as enum ('purchase','subscription','manual');
create type consent_type        as enum ('termos_de_uso','politica_privacidade','dados_saude','marketing');
create type audit_action        as enum ('insert','update','delete','access','export','consent_given','consent_revoked','deletion_requested','deletion_executed','payment_event','entitlement_granted','entitlement_revoked','journey_transition');

-- ---------------------------------------------------------------------
-- Utilidade: updated_at automatico
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- =====================================================================
-- 1. IDENTIDADE E JORNADA
-- =====================================================================

-- Perfil 1:1 com auth.users. Guarda o estado atual da jornada (denormalizado
-- para leitura barata); o historico completo fica em journey_transitions.
create table profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  display_name           text,
  birth_year             smallint check (birth_year between 1900 and extract(year from now())::int),
  sex                    text check (sex in ('f','m','outro','nao_informar')),
  current_journey_state  journey_state not null default 'pre',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table profiles is 'Perfil do usuario, 1:1 com auth.users. Estado atual da jornada denormalizado.';

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Historico datado de transicoes PRE/DURANTE/POS. Append-only.
create table journey_transitions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  from_state  journey_state,                 -- null na primeira transicao
  to_state    journey_state not null,
  changed_at  timestamptz not null default now(),
  note        text
);
comment on table journey_transitions is 'Historico datado das transicoes de jornada (PRE/DURANTE/POS).';
create index idx_journey_tx_user_time on journey_transitions(user_id, changed_at desc);

-- Medicacao em uso: DADO BRUTO informado pelo usuario, opcional. O sistema
-- so armazena; nunca calcula, sugere ou versiona dose. dose_note e texto
-- opaco (nunca interpretado por logica de negocio).
create table user_medications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  name               text not null,          -- nome comercial como o usuario digitou
  active_ingredient  text,                   -- opcional, livre
  dose_note          text,                   -- OPACO: texto livre, nunca computado
  started_on         date,
  still_using        boolean not null default true,
  note               text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table user_medications is 'Medicacao que o usuario declara usar. Dado bruto/opcional. dose_note e texto opaco, nunca interpretado.';
create trigger trg_user_meds_updated before update on user_medications
  for each row execute function set_updated_at();
create index idx_user_meds_user on user_medications(user_id);

-- =====================================================================
-- 2. TRACKERS (dados sensiveis de saude sob a LGPD)
-- =====================================================================

create table symptom_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  kind          symptom_kind not null,
  custom_label  text,                         -- usado quando kind = 'outro'
  severity      smallint not null check (severity between 1 and 3),  -- 1 leve, 2 moderado, 3 forte
  note          text,
  created_at    timestamptz not null default now()
);
comment on table symptom_logs is 'Registros pontuais de sintomas. Dado sensivel de saude (LGPD).';
create index idx_symptom_user_time on symptom_logs(user_id, logged_at desc);
create index idx_symptom_user_kind on symptom_logs(user_id, kind, logged_at desc);

-- Proteina como APOIO a nutricao adequada. A faixa 1,2-1,6 g/kg/dia e
-- apenas informativa (validada por profissional); o sistema NAO impoe meta.
create table protein_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  logged_on   date not null default current_date,
  grams       numeric(6,1) not null check (grams >= 0 and grams <= 1000),
  source_note text,
  created_at  timestamptz not null default now()
);
comment on table protein_logs is 'Ingestao de proteina (apoio nutricional). Faixa de referencia e informativa, nunca meta imposta.';
create index idx_protein_user_day on protein_logs(user_id, logged_on desc);

create table training_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  performed_at  timestamptz not null default now(),
  type          training_type not null default 'forca',
  duration_min  smallint check (duration_min between 0 and 600),
  intensity     intensity_level,
  note          text,
  created_at    timestamptz not null default now()
);
comment on table training_sessions is 'Sessoes de treino (foco em forca). Dado de saude/atividade.';
create index idx_training_user_time on training_sessions(user_id, performed_at desc);

-- Medidas corporais: sensivel. Sem metas de peso e sem antes/depois; peso e
-- opcional e bruto, sem objetivo imposto pelo sistema.
create table body_measurements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  measured_on  date not null default current_date,
  waist_cm     numeric(5,1) check (waist_cm between 20 and 300),
  hip_cm       numeric(5,1) check (hip_cm between 20 and 300),
  arm_cm       numeric(5,1) check (arm_cm between 5 and 150),
  thigh_cm     numeric(5,1) check (thigh_cm between 10 and 200),
  weight_kg    numeric(5,1) check (weight_kg between 20 and 400),   -- opcional, bruto
  note         text,
  created_at   timestamptz not null default now()
);
comment on table body_measurements is 'Medidas corporais (sensivel). Peso opcional e bruto; sem meta de peso no sistema.';
create index idx_measure_user_day on body_measurements(user_id, measured_on desc);

-- =====================================================================
-- 3. CATALOGO E ENTREGA DO CURSO
-- =====================================================================

-- Produtos vendaveis: produto principal, order bump, upsell e o plano de
-- assinatura. price_cents em centavos para evitar float.
create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        citext unique not null,
  name        text not null,
  description text,
  kind        text not null check (kind in ('one_time','subscription')),
  price_cents integer not null check (price_cents >= 0),
  currency    text not null default 'BRL',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
comment on table products is 'Itens vendaveis: produto principal, order bump, upsell e plano de assinatura.';

-- Modulos do curso (PDFs). storage_path aponta para o objeto no bucket privado.
-- unlock_delay_days = 7 no bonus "Manutencao Blindada"; 0 nos demais.
create table modules (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references products(id) on delete set null,
  code              citext unique not null,   -- parte_1..parte_4, bonus_manutencao
  title             text not null,
  storage_path      text not null,            -- ex.: curso/parte_1.pdf
  order_index       smallint not null default 0,
  is_bonus          boolean not null default false,
  unlock_delay_days smallint not null default 0 check (unlock_delay_days >= 0),
  created_at        timestamptz not null default now()
);
comment on table modules is 'Modulos do curso em PDF. Conteudo revisado e assinado por CRN antes de publicar. Bonus libera apos unlock_delay_days.';

-- =====================================================================
-- 4. PAGAMENTOS E ASSINATURA
-- =====================================================================

-- Pedido (checkout). Escrito apenas pelo backend (service_role) via webhook.
create table purchases (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete restrict,
  gateway          gateway_provider not null,
  gateway_order_id text,
  status           payment_status not null default 'pending',
  total_cents      integer not null check (total_cents >= 0),
  currency         text not null default 'BRL',
  created_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  unique (gateway, gateway_order_id)
);
comment on table purchases is 'Pedido/checkout. Escrito somente pelo backend (service_role) a partir do gateway.';
create index idx_purchases_user on purchases(user_id, created_at desc);

create table purchase_items (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id  uuid not null references products(id) on delete restrict,
  item_type   purchase_item_type not null,
  price_cents integer not null check (price_cents >= 0),
  qty         smallint not null default 1 check (qty > 0)
);
comment on table purchase_items is 'Itens de um pedido: principal, order bump, upsell.';
create index idx_purchase_items_purchase on purchase_items(purchase_id);

create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references profiles(id) on delete restrict,
  gateway                 gateway_provider not null,
  gateway_subscription_id text,
  product_id              uuid references products(id) on delete set null,
  status                  subscription_status not null default 'active',
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  canceled_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (gateway, gateway_subscription_id)
);
comment on table subscriptions is 'Assinatura recorrente mensal. Estado espelhado do gateway via webhook.';
create trigger trg_subs_updated before update on subscriptions
  for each row execute function set_updated_at();
create index idx_subs_user on subscriptions(user_id, created_at desc);

-- Transacoes/eventos de pagamento. NUNCA guardar dados de cartao; method e
-- pix/card/boleto e raw traz apenas metadados nao sensiveis.
create table payments (
  id                 uuid primary key default gen_random_uuid(),
  purchase_id        uuid references purchases(id) on delete set null,
  subscription_id    uuid references subscriptions(id) on delete set null,
  gateway            gateway_provider not null,
  gateway_payment_id text,
  status             payment_status not null,
  amount_cents       integer not null check (amount_cents >= 0),
  method             text check (method in ('pix','card','boleto','outro')),
  raw                jsonb not null default '{}'::jsonb,   -- metadados nao sensiveis
  created_at         timestamptz not null default now(),
  unique (gateway, gateway_payment_id)
);
comment on table payments is 'Transacoes de pagamento. Sem dados de cartao. raw guarda apenas metadados nao sensiveis.';
create index idx_payments_purchase on payments(purchase_id);

-- Direito de acesso por modulo. unlock_at aplica a regra do 7o dia do bonus.
-- Acesso efetivo = granted, nao revogado e now() >= unlock_at (quando houver).
create table entitlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  module_id   uuid not null references modules(id) on delete cascade,
  source      entitlement_source not null,
  purchase_id uuid references purchases(id) on delete set null,
  granted_at  timestamptz not null default now(),
  unlock_at   timestamptz,                    -- bonus: confirmed_at + 7 dias
  revoked_at  timestamptz,
  unique (user_id, module_id)
);
comment on table entitlements is 'Direito de acesso por modulo. unlock_at implementa a liberacao do bonus no 7o dia.';
create index idx_entitlements_user on entitlements(user_id);

-- Idempotencia de webhooks: cada evento do gateway e processado uma unica vez.
create table webhook_events (
  id           uuid primary key default gen_random_uuid(),
  gateway      gateway_provider not null,
  event_id     text not null,
  type         text,
  payload      jsonb not null default '{}'::jsonb,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  error        text,
  unique (gateway, event_id)
);
comment on table webhook_events is 'Registro de webhooks para idempotencia e reprocessamento seguro.';

-- =====================================================================
-- 5. LGPD: CONSENTIMENTO, AUDITORIA E EXCLUSAO
-- =====================================================================

-- Eventos de consentimento (append-only). A versao registra qual texto de
-- politica foi aceito. O consentimento mais recente por tipo governa.
create table consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  consent_type consent_type not null,
  granted      boolean not null,
  version      text not null,                 -- ex.: 'privacidade-2026-09'
  granted_at   timestamptz not null default now(),
  ip           inet,
  user_agent   text
);
comment on table consents is 'Trilha de consentimento LGPD (append-only). O evento mais recente por tipo governa.';
create index idx_consents_user_type on consents(user_id, consent_type, granted_at desc);

-- Trilha de auditoria. Minimizacao: registra a acao e a referencia, NUNCA o
-- conteudo sensivel (sem valores de sintoma/medida/medicacao).
create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete set null,
  actor      text not null default 'user' check (actor in ('user','system','service')),
  action     audit_action not null,
  entity     text,                            -- nome da tabela/recurso
  entity_id  text,
  meta       jsonb not null default '{}'::jsonb,  -- apenas metadados nao sensiveis
  at         timestamptz not null default now()
);
comment on table audit_log is 'Trilha de auditoria (minimizacao: sem conteudo sensivel, so acao e referencia).';
create index idx_audit_user_time on audit_log(user_id, at desc);

-- Pedidos de exclusao do titular. Guardamos o pedido como prova de atendimento.
create table data_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  requested_at  timestamptz not null default now(),
  status        text not null default 'requested' check (status in ('requested','processing','done','canceled')),
  scheduled_for timestamptz,
  executed_at   timestamptz,
  note          text
);
comment on table data_deletion_requests is 'Solicitacoes de exclusao (direito do titular). Registro mantido como prova de atendimento.';
