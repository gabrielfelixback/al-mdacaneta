// Dicas curtas do Método 3P (Priorizar proteína · Planejar refeições pequenas · Preparar a transição).
export const TIPS: { p: 'P1' | 'P2' | 'P3'; title: string; body: string }[] = [
  { p: 'P1', title: 'Proteína primeiro', body: 'Comece o prato pela proteína. Se a fome acabar no meio, o mais importante já foi.' },
  { p: 'P1', title: 'Cada garfada conta', body: 'Em dias sem apetite, iogurte proteico, ovos ou um shake garantem a base do dia.' },
  { p: 'P2', title: 'Pequeno e frequente', body: 'Três refeições pequenas e dois lanches rendem mais do que uma refeição grande que não desce.' },
  { p: 'P2', title: 'Dia da aplicação', body: 'Deixe algo proteico pronto na geladeira para as primeiras 48 horas.' },
  { p: 'P2', title: 'Intestino em dia', body: 'Água ao longo do dia, fibras que cabem no apetite e movimento. Regularidade é método.' },
  { p: 'P3', title: 'Hábito que fica', body: 'Cada semana de tratamento é uma semana de hábito construído. É isso que continua quando a caneta sai.' },
  { p: 'P3', title: 'Músculo é seguro', body: 'Treino de força 2–3x por semana protege a massa magra e o resultado a longo prazo.' },
];

export function tipOfDay(d = new Date()): (typeof TIPS)[number] {
  const n = Math.floor(d.getTime() / 86_400_000);
  return TIPS[n % TIPS.length];
}
