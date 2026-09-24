-- =====================================================================
-- Alem da Caneta - Row Level Security
-- Principio: RLS ligada em TODAS as tabelas. O cliente (papel authenticated)
-- so enxerga e escreve os proprios dados. Tabelas financeiras e de acesso
-- sao somente-leitura para o dono; escrita apenas pelo backend (service_role,
-- que ignora RLS por padrao no Postgres/Supabase). Catalogo e leitura para
-- qualquer usuario autenticado. Tabelas internas (webhooks) ficam sem
-- policy nenhuma, logo inacessiveis a qualquer papel exceto service_role.
-- =====================================================================

-- Liga RLS em todas as tabelas do MVP.
alter table profiles               enable row level security;
alter table journey_transitions    enable row level security;
alter table user_medications       enable row level security;
alter table symptom_logs           enable row level security;
alter table protein_logs           enable row level security;
alter table training_sessions      enable row level security;
alter table body_measurements      enable row level security;
alter table products               enable row level security;
alter table modules                enable row level security;
alter table purchases              enable row level security;
alter table purchase_items         enable row level security;
alter table subscriptions          enable row level security;
alter table payments               enable row level security;
alter table entitlements           enable row level security;
alter table webhook_events         enable row level security;
alter table consents               enable row level security;
alter table audit_log              enable row level security;
alter table data_deletion_requests enable row level security;

-- Garante que nem o dono da tabela escape da RLS por engano.
alter table purchases          force row level security;
alter table purchase_items     force row level security;
alter table subscriptions      force row level security;
alter table payments           force row level security;
alter table entitlements       force row level security;
alter table webhook_events     force row level security;
alter table audit_log          force row level security;

-- ---------------------------------------------------------------------
-- PERFIL: o usuario le e atualiza o proprio perfil. A criacao acontece
-- por trigger (handle_new_user) rodando com privilegio; nao ha policy de
-- insert para o cliente.
-- ---------------------------------------------------------------------
create policy profiles_select_own on profiles
  for select using (id = auth.uid());
create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- JORNADA: leitura do proprio historico. A insercao de transicao passa
-- pela funcao record_journey_transition (security definer), entao nao
-- expomos insert direto ao cliente.
-- ---------------------------------------------------------------------
create policy journey_select_own on journey_transitions
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Macro reutilizavel para trackers "dono faz tudo com o proprio dado".
-- (Escrito explicito por tabela para ficar legivel na revisao.)
-- ---------------------------------------------------------------------

-- MEDICACAO (dado bruto do usuario)
create policy meds_select_own on user_medications
  for select using (user_id = auth.uid());
create policy meds_insert_own on user_medications
  for insert with check (user_id = auth.uid());
create policy meds_update_own on user_medications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy meds_delete_own on user_medications
  for delete using (user_id = auth.uid());

-- SINTOMAS
create policy symptom_select_own on symptom_logs
  for select using (user_id = auth.uid());
create policy symptom_insert_own on symptom_logs
  for insert with check (user_id = auth.uid());
create policy symptom_update_own on symptom_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy symptom_delete_own on symptom_logs
  for delete using (user_id = auth.uid());

-- PROTEINA
create policy protein_select_own on protein_logs
  for select using (user_id = auth.uid());
create policy protein_insert_own on protein_logs
  for insert with check (user_id = auth.uid());
create policy protein_update_own on protein_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy protein_delete_own on protein_logs
  for delete using (user_id = auth.uid());

-- TREINO
create policy training_select_own on training_sessions
  for select using (user_id = auth.uid());
create policy training_insert_own on training_sessions
  for insert with check (user_id = auth.uid());
create policy training_update_own on training_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy training_delete_own on training_sessions
  for delete using (user_id = auth.uid());

-- MEDIDAS CORPORAIS
create policy measure_select_own on body_measurements
  for select using (user_id = auth.uid());
create policy measure_insert_own on body_measurements
  for insert with check (user_id = auth.uid());
create policy measure_update_own on body_measurements
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy measure_delete_own on body_measurements
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- CATALOGO: qualquer usuario autenticado le produtos e modulos ativos.
-- (O storage_path so vira link assinado depois da checagem de acesso na
-- Edge Function; ler a linha do modulo nao da acesso ao PDF.)
-- ---------------------------------------------------------------------
create policy products_read_all on products
  for select to authenticated using (active = true);
create policy modules_read_all on modules
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- FINANCEIRO: o dono LE os proprios registros. Nenhuma policy de escrita
-- para o cliente: pedidos, itens, assinaturas, pagamentos e entitlements
-- sao gravados exclusivamente pelo backend via service_role.
-- ---------------------------------------------------------------------
create policy purchases_select_own on purchases
  for select using (user_id = auth.uid());

create policy purchase_items_select_own on purchase_items
  for select using (
    exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid())
  );

create policy subscriptions_select_own on subscriptions
  for select using (user_id = auth.uid());

create policy payments_select_own on payments
  for select using (
    (purchase_id is not null and exists (
      select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
    or
    (subscription_id is not null and exists (
      select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid()))
  );

create policy entitlements_select_own on entitlements
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- WEBHOOKS: dado interno. Sem nenhuma policy => nenhum papel do cliente
-- (anon/authenticated) le ou escreve. So o service_role acessa.
-- ---------------------------------------------------------------------
-- (intencionalmente sem policies)

-- ---------------------------------------------------------------------
-- LGPD
-- Consentimento: o usuario LE o proprio historico e pode inserir novos
-- eventos (dar/retirar consentimento). Append-only: sem update/delete.
-- ---------------------------------------------------------------------
create policy consents_select_own on consents
  for select using (user_id = auth.uid());
create policy consents_insert_own on consents
  for insert with check (user_id = auth.uid());

-- Auditoria: o titular pode LER a propria trilha (direito de acesso).
-- Escrita so pelo backend/trigger. Sem update/delete para ninguem do cliente.
create policy audit_select_own on audit_log
  for select using (user_id = auth.uid());

-- Pedidos de exclusao: o usuario cria e le os proprios pedidos.
-- A execucao/mudanca de status fica com o backend.
create policy deletion_select_own on data_deletion_requests
  for select using (user_id = auth.uid());
create policy deletion_insert_own on data_deletion_requests
  for insert with check (user_id = auth.uid());
