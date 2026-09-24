-- =====================================================================
-- Alem da Caneta - Seed do catalogo (produtos e modulos do curso)
-- Idempotente: usa on conflict para poder rodar de novo sem duplicar.
-- Precos sao provisorios e ficam a cargo do time comercial.
-- O conteudo dos PDFs e revisado e assinado por nutricionista (CRN)
-- antes de subir ao bucket privado 'curso'; o sistema so guarda e entrega.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Produtos
-- ---------------------------------------------------------------------
insert into products (slug, name, description, kind, price_cents, currency, active) values
  ('metodo-3p',        'Metodo 3P - curso completo', 'Acesso vitalicio aos 4 modulos do curso mais o bonus.', 'one_time',    19700, 'BRL', true),
  ('alem-pro-mensal',  'Alem Pro - assinatura mensal', 'Assinatura mensal com recursos Pro do app.',           'subscription', 1990, 'BRL', true)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      kind = excluded.kind,
      price_cents = excluded.price_cents,
      currency = excluded.currency,
      active = excluded.active;

-- ---------------------------------------------------------------------
-- Modulos do curso. As 4 partes liberam na confirmacao (unlock_delay_days=0).
-- O bonus "Manutencao Blindada" libera no 7o dia (unlock_delay_days=7).
-- storage_path aponta para o objeto no bucket privado 'curso'.
-- ---------------------------------------------------------------------
with p as (select id from products where slug = 'metodo-3p')
insert into modules (product_id, code, title, storage_path, order_index, is_bonus, unlock_delay_days)
select p.id, v.code, v.title, v.storage_path, v.order_index, v.is_bonus, v.unlock_delay_days
from p, (values
  ('parte_1',           'Parte 1 - Priorizar proteina',        'curso/parte_1.pdf',            1, false, 0),
  ('parte_2',           'Parte 2 - Planejar refeicoes pequenas','curso/parte_2.pdf',           2, false, 0),
  ('parte_3',           'Parte 3 - Preparar a transicao',      'curso/parte_3.pdf',            3, false, 0),
  ('parte_4',           'Parte 4 - Rotina e habitos que ficam','curso/parte_4.pdf',            4, false, 0),
  ('bonus_manutencao',  'Bonus - Manutencao Blindada',         'curso/bonus_manutencao.pdf',   5, true,  7)
) as v(code, title, storage_path, order_index, is_bonus, unlock_delay_days)
on conflict (code) do update
  set product_id = excluded.product_id,
      title = excluded.title,
      storage_path = excluded.storage_path,
      order_index = excluded.order_index,
      is_bonus = excluded.is_bonus,
      unlock_delay_days = excluded.unlock_delay_days;
