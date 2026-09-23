// Materiais do curso Método 3P, liberados no plano Pro.
// Preencha `url` com o link do PDF hospedado (ex.: storage privado com link assinado).

export interface LibraryItem {
  id: string;
  title: string;
  italic: string;
  subtitle: string;
  tag: 'Guia' | 'P1' | 'P2' | 'P3';
  tone: 'floresta' | 'linho' | 'salvia' | 'argila';
  /** Dias após a assinatura para liberar (ex.: Plano do Depois no 7º dia). */
  unlockAfterDays?: number;
  url?: `https://${string}`;
}

export const LIBRARY: LibraryItem[] = [
  {
    id: 'guia-3p',
    title: 'além',
    italic: 'da caneta',
    subtitle: 'Guia principal · Método 3P completo para antes, durante e depois do tratamento.',
    tag: 'Guia',
    tone: 'floresta',
  },
  {
    id: 'cardapio-sem-fome',
    title: 'Cardápio',
    italic: 'Sem Fome',
    subtitle: '30 refeições para os dias em que nada desce, e mesmo assim entregam proteína.',
    tag: 'P1',
    tone: 'linho',
  },
  {
    id: 'sos-sem-fome',
    title: 'SOS',
    italic: 'não tô com fome',
    subtitle: 'O que comer, em minutos, quando a última coisa que você quer é comer.',
    tag: 'P1',
    tone: 'argila',
  },
  {
    id: 'carrinho-pronto',
    title: 'Carrinho',
    italic: 'Pronto',
    subtitle: 'A lista de compras inteligente: entre no mercado já sabendo o que pegar.',
    tag: 'P2',
    tone: 'salvia',
  },
  {
    id: 'fora-de-casa',
    title: 'Kit',
    italic: 'Fora de Casa',
    subtitle: 'Como pedir no restaurante e no delivery sem abandonar a rotina.',
    tag: 'P2',
    tone: 'linho',
  },
  {
    id: 'intestino-destravado',
    title: 'Intestino',
    italic: 'Destravado',
    subtitle: 'A rotina para não deixar o intestino travar, um dos efeitos mais comuns da caneta.',
    tag: 'P2',
    tone: 'salvia',
  },
  {
    id: 'tracker-evolucao',
    title: 'Tracker de',
    italic: 'Evolução',
    subtitle: 'Energia, proteína, intestino e rotina: a evolução além da balança.',
    tag: 'P2',
    tone: 'linho',
  },
  {
    id: 'plano-do-depois',
    title: 'Plano do',
    italic: 'Depois',
    subtitle: 'Como transformar o tratamento em hábitos que ficam quando a caneta sair.',
    tag: 'P3',
    tone: 'floresta',
    unlockAfterDays: 7,
  },
];

export function daysUntilUnlock(item: LibraryItem, proSince?: string, now = new Date()): number {
  if (!item.unlockAfterDays || !proSince) return 0;
  const unlockAt = new Date(proSince).getTime() + item.unlockAfterDays * 86_400_000;
  return Math.max(0, Math.ceil((unlockAt - now.getTime()) / 86_400_000));
}
