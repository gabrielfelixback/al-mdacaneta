import type { Poll, Post } from './types';

// Conteúdo de demonstração da comunidade até o backend social entrar no ar.
const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export const SEED_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Vitória L.',
    at: ago(9),
    body: 'Quarta semana com tirzepatida 2,5 mg. Faço musculação 4x na semana e notei a barriga mais estufada nos últimos dias. Alguém mais passou por isso? O que ajudou?',
    tag: 'Tirzepatida',
    likes: 4,
    comments: [
      {
        id: 'c1',
        author: 'Carla M.',
        body: 'Comigo foi o intestino. Aumentei a água e coloquei chia no iogurte, melhorou em uns 3 dias.',
        at: ago(5),
      },
    ],
  },
  {
    id: 'p2',
    author: 'Lucélia H.',
    at: ago(22),
    body: 'Três meses oscilando no mesmo peso. Voltei a pesar a proteína do almoço e percebi que estava comendo bem menos do que achava. Registrar aqui no app abriu meus olhos.',
    tag: 'Semaglutida',
    likes: 12,
    comments: [],
  },
  {
    id: 'p3',
    author: 'Rafael T.',
    at: ago(47),
    body: 'Dica para o dia da aplicação: deixo um shake de proteína pronto na geladeira. Nas primeiras 48h não desce quase nada, e assim não passo o dia em branco.',
    tag: 'Mounjaro',
    likes: 21,
    comments: [
      { id: 'c2', author: 'Ana P.', body: 'Faço o mesmo com iogurte proteico!', at: ago(30) },
      { id: 'c3', author: 'Bia S.', body: 'Salvou minha semana, obrigada.', at: ago(12) },
    ],
  },
  {
    id: 'p4',
    author: 'Marina C.',
    at: ago(180),
    body: 'Parei a caneta há 2 meses com acompanhamento. O que mais me ajudou foi ter montado a rotina de refeições antes de parar. A fome voltou, mas eu já sabia o que fazer.',
    tag: 'Plano do depois',
    likes: 38,
    comments: [],
  },
];

export const SEED_POLLS: Poll[] = [
  {
    id: 'q1',
    question: 'Qual efeito colateral mais te incomodou nas primeiras semanas?',
    at: ago(120),
    options: [
      { id: 'a', label: 'Náusea', votes: 142 },
      { id: 'b', label: 'Intestino preso', votes: 188 },
      { id: 'c', label: 'Cansaço', votes: 97 },
      { id: 'd', label: 'Nenhum', votes: 41 },
    ],
  },
  {
    id: 'q2',
    question: 'Em que horário você costuma aplicar?',
    at: ago(600),
    options: [
      { id: 'a', label: 'Manhã', votes: 120 },
      { id: 'b', label: 'Tarde', votes: 44 },
      { id: 'c', label: 'Noite', votes: 163 },
    ],
  },
];

export const COMMUNITY_TAGS = ['Tirzepatida', 'Semaglutida', 'Mounjaro', 'Ozempic', 'Wegovy', 'Plano do depois', 'Dúvida'];
