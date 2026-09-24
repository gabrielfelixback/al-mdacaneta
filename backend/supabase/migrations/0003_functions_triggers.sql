-- =====================================================================
-- Alem da Caneta - Funcoes, triggers e views
-- Regras de negocio que precisam rodar no banco com privilegio controlado:
-- criacao do perfil, transicao de jornada datada, checagem de acesso a
-- modulo (inclusive a regra do 7o dia do bonus) e auditoria minimizada.
-- Todas as funcoes security definer fixam search_path para evitar captura.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Novo usuario -> cria perfil e registra a primeira transicao (para 'pre').
-- Dispara no schema auth, entao roda como definer.
-- ---------------------------------------------------------------------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null))
  on conflict (id) do nothing;

  insert into public.journey_transitions (user_id, from_state, to_state)
  values (new.id, null, 'pre');

  insert into public.audit_log (user_id, actor, action, entity, entity_id)
  values (new.id, 'system', 'insert', 'profiles', new.id::text);

  return new;
end $$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- Transicao de jornada datada e consistente. Atualiza o estado
-- denormalizado no perfil e grava a linha no historico, numa transacao.
-- Chamada pela Edge Function com o JWT do usuario; a funcao confirma que
-- o alvo e o proprio usuario.
-- ---------------------------------------------------------------------
create or replace function record_journey_transition(p_to journey_state, p_note text default null)
returns journey_transitions
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_from journey_state;
  v_row  journey_transitions;
begin
  if v_user is null then
    raise exception 'sem usuario autenticado' using errcode = '28000';
  end if;

  select current_journey_state into v_from from profiles where id = v_user for update;
  if not found then
    raise exception 'perfil inexistente' using errcode = 'P0002';
  end if;

  -- Idempotente: transicao para o mesmo estado nao gera ruido no historico.
  if v_from = p_to then
    select * into v_row from journey_transitions
      where user_id = v_user order by changed_at desc limit 1;
    return v_row;
  end if;

  update profiles set current_journey_state = p_to where id = v_user;

  insert into journey_transitions (user_id, from_state, to_state, note)
  values (v_user, v_from, p_to, p_note)
  returning * into v_row;

  insert into audit_log (user_id, actor, action, entity, entity_id, meta)
  values (v_user, 'user', 'journey_transition', 'journey_transitions', v_row.id::text,
          jsonb_build_object('from', v_from, 'to', p_to));

  return v_row;
end $$;

-- ---------------------------------------------------------------------
-- Acesso efetivo a um modulo para o usuario atual.
-- Regras: existe entitlement, nao revogado, e (sem unlock_at OU ja passou
-- do unlock_at). Cobre a liberacao do bonus no 7o dia.
-- ---------------------------------------------------------------------
create or replace function has_module_access(p_module uuid)
returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from entitlements e
    where e.user_id = auth.uid()
      and e.module_id = p_module
      and e.revoked_at is null
      and (e.unlock_at is null or now() >= e.unlock_at)
  );
$$;

-- ---------------------------------------------------------------------
-- Auditoria minimizada em tabelas sensiveis. Grava SO acao + referencia,
-- nunca o conteudo (valores de sintoma, medida, medicacao ficam fora).
-- ---------------------------------------------------------------------
create or replace function audit_sensitive() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action audit_action;
  v_id text;
  v_user uuid;
begin
  if tg_op = 'INSERT' then v_action := 'insert'; v_id := new.id::text; v_user := new.user_id;
  elsif tg_op = 'UPDATE' then v_action := 'update'; v_id := new.id::text; v_user := new.user_id;
  else v_action := 'delete'; v_id := old.id::text; v_user := old.user_id;
  end if;

  insert into audit_log (user_id, actor, action, entity, entity_id)
  values (v_user, 'user', v_action, tg_table_name, v_id);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger trg_audit_symptom after insert or update or delete on symptom_logs
  for each row execute function audit_sensitive();
create trigger trg_audit_protein after insert or update or delete on protein_logs
  for each row execute function audit_sensitive();
create trigger trg_audit_training after insert or update or delete on training_sessions
  for each row execute function audit_sensitive();
create trigger trg_audit_measure after insert or update or delete on body_measurements
  for each row execute function audit_sensitive();
create trigger trg_audit_meds after insert or update or delete on user_medications
  for each row execute function audit_sensitive();

-- ---------------------------------------------------------------------
-- Views de tendencia (apoio, nunca meta). security_invoker garante que
-- a RLS do usuario continua valendo: cada um so ve os proprios agregados.
-- ---------------------------------------------------------------------
create or replace view v_protein_daily
  with (security_invoker = true) as
  select user_id, logged_on, round(sum(grams), 1) as total_g, count(*) as registros
  from protein_logs
  group by user_id, logged_on;
comment on view v_protein_daily is 'Proteina somada por dia (apoio). Faixa de referencia e informativa, nao meta.';

create or replace view v_symptom_weekly
  with (security_invoker = true) as
  select user_id,
         date_trunc('week', logged_at)::date as semana,
         kind,
         count(*) as ocorrencias,
         round(avg(severity), 2) as severidade_media
  from symptom_logs
  group by user_id, date_trunc('week', logged_at), kind;
comment on view v_symptom_weekly is 'Sintomas agregados por semana e tipo (apoio a consulta).';

create or replace view v_training_weekly
  with (security_invoker = true) as
  select user_id,
         date_trunc('week', performed_at)::date as semana,
         count(*) as sessoes,
         coalesce(sum(duration_min), 0) as minutos_total
  from training_sessions
  group by user_id, date_trunc('week', performed_at);
comment on view v_training_weekly is 'Treino agregado por semana (apoio a consulta).';
