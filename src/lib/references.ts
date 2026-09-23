// Fontes públicas que embasam os cálculos e textos do app.
// Mantidas em um só lugar para aparecerem na tela "Referências médicas".

export interface Reference {
  title: string;
  source: string;
  url: `https://${string}`;
}

export interface ReferenceGroup {
  id: string;
  title: string;
  items: Reference[];
}

export const REFERENCE_GROUPS: ReferenceGroup[] = [
  {
    id: 'medicamentos',
    title: 'Medicamentos GLP-1 — doses, meia-vida e efeitos colaterais',
    items: [
      {
        title: 'Bulário Eletrônico — bulas oficiais dos medicamentos',
        source: 'ANVISA',
        url: 'https://consultas.anvisa.gov.br/#/bulario/',
      },
      {
        title: 'Mounjaro (tirzepatida) — Prescribing Information',
        source: 'FDA / DailyMed',
        url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=mounjaro',
      },
      {
        title: 'Ozempic (semaglutida) — Prescribing Information',
        source: 'FDA / DailyMed',
        url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=ozempic',
      },
      {
        title: 'Wegovy (semaglutida) — Prescribing Information',
        source: 'FDA / DailyMed',
        url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=wegovy',
      },
      {
        title: 'Medicamentos para sobrepeso e obesidade — visão geral',
        source: 'NIH / NIDDK',
        url: 'https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity',
      },
    ],
  },
  {
    id: 'imc',
    title: 'Índice de Massa Corporal (IMC)',
    items: [
      {
        title: 'Obesidade e sobrepeso — classificação de IMC',
        source: 'OMS',
        url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
      },
    ],
  },
  {
    id: 'estudos',
    title: 'Eficácia, efeitos colaterais e o depois — estudos clínicos',
    items: [
      {
        title: 'Tirzepatida na obesidade — estudo SURMOUNT-1 (2022)',
        source: 'NEJM',
        url: 'https://doi.org/10.1056/NEJMoa2206038',
      },
      {
        title: 'Tirzepatida vs semaglutida — estudo SURPASS-2 (2021)',
        source: 'NEJM',
        url: 'https://doi.org/10.1056/NEJMoa2107519',
      },
      {
        title: 'Semaglutida na obesidade — estudo STEP-1 (2021)',
        source: 'NEJM',
        url: 'https://doi.org/10.1056/NEJMoa2032183',
      },
      {
        title: 'Interrupção da semaglutida — extensão do STEP-1 (2022)',
        source: 'Diabetes, Obesity and Metabolism',
        url: 'https://doi.org/10.1111/dom.14725',
      },
      {
        title: 'Manutenção vs interrupção da tirzepatida — SURMOUNT-4 (2024)',
        source: 'JAMA',
        url: 'https://doi.org/10.1001/jama.2023.24945',
      },
    ],
  },
  {
    id: 'proteina',
    title: 'Proteína e composição corporal',
    items: [
      {
        title: 'Dietas e composição corporal (proteína e massa magra)',
        source: 'ISSN',
        url: 'https://doi.org/10.1186/s12970-017-0174-y',
      },
      {
        title: 'Proteína e exercício',
        source: 'ISSN',
        url: 'https://doi.org/10.1186/s12970-017-0177-8',
      },
    ],
  },
  {
    id: 'energia',
    title: 'Gasto energético e alimentos',
    items: [
      {
        title: 'Equação de Mifflin-St Jeor para gasto energético de repouso (1990)',
        source: 'American Journal of Clinical Nutrition',
        url: 'https://doi.org/10.1093/ajcn/51.2.241',
      },
      {
        title: 'Compendium of Physical Activities — valores de MET',
        source: 'Compendium 2024',
        url: 'https://pacompendium.com/',
      },
      {
        title: 'Tabela Brasileira de Composição de Alimentos (TACO)',
        source: 'NEPA / UNICAMP',
        url: 'https://www.nepa.unicamp.br/taco/',
      },
    ],
  },
];
