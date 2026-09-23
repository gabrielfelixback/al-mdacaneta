// Base local de alimentos comuns no Brasil, por porção caseira.
// Valores aproximados a partir da TACO (NEPA/UNICAMP) e rótulos típicos.

export interface Food {
  id: string;
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

type Row = [id: string, name: string, portion: string, kcal: number, p: number, c: number, f: number, fib: number];

const ROWS: Row[] = [
  // Proteínas
  ['frango-grelhado', 'Peito de frango grelhado', '1 filé (100 g)', 159, 32, 0, 2.5, 0],
  ['patinho-grelhado', 'Patinho grelhado', '1 bife (100 g)', 219, 35.9, 0, 7.3, 0],
  ['carne-moida', 'Carne moída refogada', '4 col. sopa (100 g)', 212, 26.7, 0, 10.9, 0],
  ['tilapia', 'Tilápia grelhada', '1 filé (100 g)', 128, 26, 0, 2.7, 0],
  ['salmao', 'Salmão grelhado', '1 posta (100 g)', 208, 22, 0, 13, 0],
  ['atum', 'Atum em água', '1/2 lata (60 g)', 70, 15.6, 0, 0.6, 0],
  ['ovo-cozido', 'Ovo cozido', '1 unidade (50 g)', 73, 6.7, 0.3, 4.8, 0],
  ['omelete', 'Omelete de 2 ovos', '1 unidade (120 g)', 180, 13, 1, 14, 0],
  ['crepioca', 'Crepioca', '1 unidade', 145, 6.8, 18, 5, 0],
  ['tofu', 'Tofu', '1 fatia (100 g)', 76, 8, 1.9, 4.8, 0.3],
  ['whey', 'Whey protein', '1 scoop (30 g)', 120, 24, 3, 1.5, 0],
  ['iogurte-proteico', 'Iogurte proteico', '1 pote', 100, 15, 6, 1, 0],
  ['iogurte-natural', 'Iogurte natural integral', '1 pote (170 g)', 87, 7, 3.2, 5.1, 0],
  ['shake-proteico', 'Shake proteico pronto', '1 garrafa (250 ml)', 150, 20, 8, 4, 1],
  ['barra-proteina', 'Barra de proteína', '1 unidade (45 g)', 180, 15, 15, 6, 5],
  ['cottage', 'Queijo cottage', '2 col. sopa (50 g)', 50, 6.3, 1.5, 2, 0],
  ['minas-frescal', 'Queijo minas frescal', '1 fatia (30 g)', 79, 5.2, 1, 6, 0],
  ['mucarela', 'Queijo muçarela', '1 fatia (20 g)', 66, 4.5, 0.6, 5.1, 0],
  ['leite-desnatado', 'Leite desnatado', '1 copo (200 ml)', 70, 6.8, 9.8, 0.4, 0],
  ['leite-integral', 'Leite integral', '1 copo (200 ml)', 122, 5.8, 8.6, 6.4, 0],
  // Leguminosas
  ['feijao-carioca', 'Feijão carioca', '1 concha (86 g)', 65, 4.1, 11.7, 0.4, 7.3],
  ['feijao-preto', 'Feijão preto', '1 concha (86 g)', 66, 3.9, 12, 0.4, 7.2],
  ['lentilha', 'Lentilha cozida', '1 concha (100 g)', 93, 6.3, 16.3, 0.5, 7.9],
  ['grao-de-bico', 'Grão-de-bico cozido', '4 col. sopa (100 g)', 164, 8.9, 27.4, 2.6, 7.6],
  // Carboidratos
  ['arroz-branco', 'Arroz branco', '4 col. sopa (100 g)', 128, 2.5, 28.1, 0.2, 1.6],
  ['arroz-integral', 'Arroz integral', '4 col. sopa (100 g)', 124, 2.6, 25.8, 1, 2.7],
  ['macarrao', 'Macarrão cozido', '1 escumadeira (100 g)', 157, 5.8, 30.9, 0.9, 1.8],
  ['batata-doce', 'Batata-doce cozida', '1 unidade média (100 g)', 77, 0.6, 18.4, 0.1, 2.2],
  ['mandioca', 'Mandioca cozida', '2 pedaços (100 g)', 125, 0.6, 30.1, 0.3, 1.6],
  ['batata', 'Batata inglesa cozida', '1 unidade (100 g)', 52, 1.2, 11.9, 0, 1.3],
  ['cuscuz', 'Cuscuz de milho', '1 fatia (100 g)', 113, 2.2, 25.3, 0.7, 2.1],
  ['pao-frances', 'Pão francês', '1 unidade (50 g)', 150, 4, 29.3, 1.6, 1.2],
  ['pao-integral', 'Pão integral', '2 fatias (50 g)', 127, 4.7, 25, 1.9, 3.5],
  ['tapioca', 'Tapioca', '2 col. sopa de goma (30 g)', 72, 0, 18, 0, 0],
  ['pao-de-queijo', 'Pão de queijo', '1 unidade (40 g)', 145, 2, 13.7, 9.8, 0.3],
  ['aveia', 'Aveia em flocos', '2 col. sopa (30 g)', 118, 4.4, 20, 2.2, 2.9],
  ['granola', 'Granola', '2 col. sopa (30 g)', 130, 3, 20, 4, 2],
  ['bolacha-agua-sal', 'Bolacha água e sal', '5 unidades (30 g)', 130, 3, 21, 4, 0.8],
  // Frutas
  ['banana', 'Banana prata', '1 unidade (70 g)', 69, 0.9, 18.3, 0.1, 1.4],
  ['maca', 'Maçã', '1 unidade (130 g)', 73, 0.4, 19.8, 0, 2.6],
  ['mamao', 'Mamão papaia', '1/2 unidade (150 g)', 60, 0.8, 15.6, 0.2, 1.5],
  ['morango', 'Morango', '10 unidades (120 g)', 36, 1.1, 8.2, 0.4, 2],
  ['abacate', 'Abacate', '2 col. sopa (60 g)', 58, 0.7, 3.6, 5.1, 3.8],
  ['laranja', 'Laranja', '1 unidade (150 g)', 56, 1.5, 13.7, 0.2, 1.2],
  // Vegetais
  ['salada-folhas', 'Salada de folhas', '1 prato (60 g)', 10, 0.8, 1.7, 0.1, 1.2],
  ['brocolis', 'Brócolis cozido', '1 xícara (100 g)', 25, 2.1, 4.4, 0.5, 3.4],
  ['legumes', 'Legumes cozidos', '1 xícara (100 g)', 35, 1.5, 7, 0.2, 2.5],
  ['tomate', 'Tomate', '1 unidade (100 g)', 15, 1.1, 3.1, 0.2, 1.2],
  ['cenoura', 'Cenoura ralada', '3 col. sopa (50 g)', 17, 0.7, 3.9, 0.1, 1.6],
  ['sopa-legumes-frango', 'Sopa de legumes com frango', '1 concha grande (250 g)', 120, 9, 12, 3, 2.5],
  // Gorduras e extras
  ['azeite', 'Azeite de oliva', '1 col. sopa (13 ml)', 117, 0, 0, 13, 0],
  ['pasta-amendoim', 'Pasta de amendoim', '1 col. sopa (15 g)', 90, 3.8, 3, 7.5, 1],
  ['castanha-para', 'Castanha-do-pará', '3 unidades (12 g)', 77, 1.7, 1.8, 7.6, 0.9],
  ['chia', 'Chia', '1 col. sopa (15 g)', 73, 2.5, 6.3, 4.6, 5.2],
  ['requeijao', 'Requeijão', '1 col. sopa (30 g)', 77, 2.9, 0.7, 7, 0],
  ['acucar', 'Açúcar', '1 col. chá (5 g)', 20, 0, 5, 0, 0],
  ['chocolate', 'Chocolate ao leite', '1 quadrado grande (25 g)', 135, 1.8, 15, 7.5, 0.5],
  ['gelatina-diet', 'Gelatina diet', '1 pote (110 g)', 10, 1, 0.5, 0, 0],
  // Bebidas
  ['cafe', 'Café sem açúcar', '1 xícara (50 ml)', 3, 0.1, 0.3, 0, 0],
  ['cafe-leite', 'Café com leite', '1 xícara (200 ml)', 70, 3.5, 5, 3.5, 0],
  ['suco-laranja', 'Suco de laranja natural', '1 copo (200 ml)', 90, 1.4, 20, 0.2, 0.4],
  ['refrigerante', 'Refrigerante', '1 lata (350 ml)', 140, 0, 35, 0, 0],
  ['cerveja', 'Cerveja', '1 lata (350 ml)', 145, 1, 11, 0, 0],
  ['vinho', 'Vinho tinto', '1 taça (150 ml)', 125, 0.1, 4, 0, 0],
  // Fora de casa
  ['pizza', 'Pizza de muçarela', '1 fatia (100 g)', 280, 12, 30, 12, 1.5],
  ['hamburguer', 'Hambúrguer completo', '1 lanche', 500, 25, 40, 26, 2],
  ['prato-feito', 'Prato feito (arroz, feijão, carne, salada)', '1 prato', 620, 38, 70, 18, 10],
  ['sushi', 'Sushi (niguiri/uramaki)', '8 peças', 330, 14, 52, 7, 1.5],
];

export const FOODS: Food[] = ROWS.map(([id, name, portion, kcal, protein, carbs, fat, fiber]) => ({
  id,
  name,
  portion,
  kcal,
  protein,
  carbs,
  fat,
  fiber,
}));

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function searchFoods(query: string): Food[] {
  const q = normalize(query.trim());
  if (!q) return FOODS.filter((f) => f.protein >= 10).concat(FOODS.filter((f) => f.protein < 10));
  const terms = q.split(/\s+/);
  return FOODS.filter((f) => {
    const n = normalize(f.name);
    return terms.every((t) => n.includes(t));
  });
}

/** P1 do Método 3P: destaca itens que entregam proteína de verdade na porção. */
export function isProteinRich(f: Pick<Food, 'protein' | 'kcal'>): boolean {
  return f.protein >= 10 || (f.kcal > 0 && (f.protein * 4) / f.kcal >= 0.3 && f.protein >= 5);
}
