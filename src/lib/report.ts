// Relatório clínico em HTML, convertido em PDF pelo expo-print.
import type { AppState } from '@/store/useStore';
import { dayTotals } from '@/store/useStore';
import { bmi, BMI_LABEL, bmiClass, fmt, fmtInt, fmtMg, nutritionGoals } from './calc';
import { dayKey, formatDDMM, formatTime, fromDayKey, WEEKDAYS_LONG } from './dates';
import { getMedication, INGREDIENT_LABEL, siteLabel } from './medications';
import { medicationLabel, nextDoseInfo } from './treatment';

export type ReportPeriod = 'inicio' | '90' | '30';
export type ReportSection = 'identificacao' | 'tratamento' | 'peso' | 'medidas' | 'sintomas' | 'nutricao';

export const REPORT_SECTIONS: { id: ReportSection; title: string; desc: string }[] = [
  { id: 'identificacao', title: 'Identificação', desc: 'Idade, sexo, altura, IMC e objetivo' },
  { id: 'tratamento', title: 'Tratamento e adesão', desc: 'Medicamento, dose, adesão, locais e histórico' },
  { id: 'peso', title: 'Evolução de peso', desc: 'Curva, perda total e progresso até a meta' },
  { id: 'medidas', title: 'Medidas corporais', desc: 'Circunferência da cintura' },
  { id: 'sintomas', title: 'Sintomas e efeitos', desc: 'Frequência, intensidade e intestino' },
  { id: 'nutricao', title: 'Nutrição e hidratação', desc: 'Proteína, calorias, macros e água vs metas' },
];

type Data = Pick<AppState, 'profile' | 'treatment' | 'doses' | 'weights' | 'meals' | 'water' | 'sideEffects' | 'checkins'>;

export function periodStart(s: Data, period: ReportPeriod, now = new Date()): Date {
  const start = new Date(s.treatment?.startedAt ?? s.profile?.createdAt ?? now.toISOString());
  start.setHours(0, 0, 0, 0);
  if (period === 'inicio') return start;
  const cut = new Date(now.getTime() - Number(period) * 86_400_000);
  cut.setHours(0, 0, 0, 0);
  return cut > start ? cut : start;
}

export function sectionCounts(s: Data, period: ReportPeriod) {
  const from = periodStart(s, period).getTime();
  const inP = (iso: string) => new Date(iso).getTime() >= from;
  return {
    identificacao: undefined,
    tratamento: s.doses.filter((d) => inP(d.at)).length,
    peso: s.weights.filter((w) => inP(w.at)).length,
    medidas: s.weights.filter((w) => inP(w.at) && w.waistCm).length,
    sintomas: s.sideEffects.filter((e) => inP(e.at)).length,
    nutricao: s.meals.filter((m) => inP(m.at)).length,
  } as Record<ReportSection, number | undefined>;
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const dt = (iso: string) => `${formatDDMM(new Date(iso))}/${new Date(iso).getFullYear()}`;

function tile(label: string, value: string, unit = '', sub = '', highlight = false) {
  return `<div class="tile${highlight ? ' hl' : ''}"><div class="tl">${label}</div><div class="tv">${value}<small>${unit}</small></div>${sub ? `<div class="ts">${sub}</div>` : ''}</div>`;
}

function weightSvg(points: { t: number; kg: number }[], goal: number): string {
  if (points.length < 2) return '';
  const W = 640;
  const H = 180;
  const p = 28;
  const vals = points.map((x) => x.kg).concat(goal);
  const min = Math.floor(Math.min(...vals) - 1);
  const max = Math.ceil(Math.max(...vals) + 1);
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const X = (t: number) => p + ((t - t0) / Math.max(1, t1 - t0)) * (W - 2 * p);
  const Y = (kg: number) => p / 2 + (1 - (kg - min) / (max - min)) * (H - p * 1.5);
  const d = points.map((x, i) => `${i ? 'L' : 'M'}${X(x.t).toFixed(1)} ${Y(x.kg).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">
    <line x1="${p}" x2="${W - p}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#B8744F" stroke-dasharray="5 5"/>
    <text x="${p + 4}" y="${Y(goal) - 6}" font-size="11" fill="#B8744F">meta ${fmt(goal)} kg</text>
    <path d="${d}" fill="none" stroke="#17332B" stroke-width="2.4" stroke-linejoin="round"/>
    ${points.map((x) => `<circle cx="${X(x.t)}" cy="${Y(x.kg)}" r="3.5" fill="#FFFDF9" stroke="#17332B" stroke-width="2"/>`).join('')}
    <text x="${p}" y="${H - 2}" font-size="10" fill="#7D8A80">${formatDDMM(new Date(t0))}</text>
    <text x="${W - p}" y="${H - 2}" font-size="10" fill="#7D8A80" text-anchor="end">${formatDDMM(new Date(t1))}</text>
  </svg>`;
}

const LOGO = `<svg width="46" height="21" viewBox="0 0 88 40"><rect x="2" y="17" width="26" height="14" rx="7" fill="none" stroke="#17332B" stroke-width="3"/><line x1="15" y1="17" x2="15" y2="31" stroke="#17332B" stroke-width="3"/><path d="M28 24 H50 C62 24 72 18 84 6" fill="none" stroke="#B8744F" stroke-width="3" stroke-linecap="round"/></svg>`;

export function buildReportHtml(s: Data, period: ReportPeriod, sections: Set<ReportSection>, now = new Date()): string {
  const p = s.profile!;
  const t = s.treatment!;
  const med = getMedication(t.medicationId);
  const from = periodStart(s, period, now);
  const fromMs = from.getTime();
  const inP = (iso: string) => new Date(iso).getTime() >= fromMs;

  const weightsAsc = [...s.weights].filter((w) => inP(w.at)).sort((a, b) => a.at.localeCompare(b.at));
  const current = s.weights[0]?.kg ?? p.startWeightKg;
  const age = now.getFullYear() - p.birthYear;
  const bmiNow = bmi(current, p.heightCm);
  const bmiStart = bmi(p.startWeightKg, p.heightCm);
  const lost = p.startWeightKg - current;
  const lostPct = (lost / p.startWeightKg) * 100;
  const weeks = Math.max(1, (now.getTime() - new Date(t.startedAt).getTime()) / (7 * 86_400_000));
  const goals = nutritionGoals({ sex: p.sex, weightKg: current, heightCm: p.heightCm, age, level: p.activityLevel });

  // Adesão: aplicações registradas ÷ aplicações esperadas desde o início do período.
  const intervalDays = med.frequency === 'diaria' ? 1 : 7;
  const doses = s.doses.filter((d) => inP(d.at));
  const expected = Math.max(1, Math.floor((now.getTime() - fromMs) / (intervalDays * 86_400_000)) + 1);
  const adherence = Math.min(100, Math.round((doses.length / expected) * 100));
  const dosesAsc = [...doses].sort((a, b) => a.at.localeCompare(b.at));
  const gaps = dosesAsc.slice(1).map((d, i) => (new Date(d.at).getTime() - new Date(dosesAsc[i].at).getTime()) / 86_400_000);
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const sites = doses.reduce<Record<string, number>>((acc, d) => {
    if (d.site) acc[d.site] = (acc[d.site] ?? 0) + 1;
    return acc;
  }, {});
  const next = nextDoseInfo(t, s.doses, now);

  const effects = s.sideEffects.filter((e) => inP(e.at));
  const mealDays = [...new Set(s.meals.filter((m) => inP(m.at)).map((m) => m.day))];
  const avg = (f: (d: string) => number) => (mealDays.length ? mealDays.reduce((a, d) => a + f(d), 0) / mealDays.length : 0);
  const tot = (d: string) => dayTotals(s.meals.filter((m) => m.day === d));
  const avgProt = avg((d) => tot(d).protein);
  const protDaysPct = mealDays.length
    ? Math.round((mealDays.filter((d) => tot(d).protein >= goals.protein * 0.9).length / mealDays.length) * 100)
    : 0;
  const waterDays = Object.entries(s.water).filter(([d, ml]) => ml > 0 && fromDayKey(d).getTime() >= fromMs);
  const avgWater = waterDays.length ? waterDays.reduce((a, [, ml]) => a + ml, 0) / waterDays.length : 0;
  const checkDays = Object.entries(s.checkins).filter(([d]) => fromDayKey(d).getTime() >= fromMs);
  const gut = checkDays.reduce<Record<string, number>>((acc, [, c]) => {
    if (c.gut) acc[c.gut] = (acc[c.gut] ?? 0) + 1;
    return acc;
  }, {});

  const periodLabel = period === 'inicio' ? 'Desde o início do tratamento' : `Últimos ${period} dias`;
  const n = (() => {
    let i = 0;
    return () => String(++i).padStart(2, '0');
  })();

  const parts: string[] = [];

  parts.push(`
  <header>
    <div>
      <div class="brand">${LOGO}<span><i>além</i> da caneta</span></div>
      <div class="kicker">Relatório clínico</div>
      <h1>Acompanhamento de <i>tratamento</i></h1>
    </div>
    <div class="meta">
      <div><span>Paciente</span>${esc(p.name)}</div>
      <div><span>Emitido em</span>${dt(now.toISOString())} às ${formatTime(now)}</div>
      <div><span>Período</span>${periodLabel} · ${dt(from.toISOString())} – ${dt(now.toISOString())}</div>
    </div>
  </header>
  <div class="kicker">Resumo</div>
  <div class="grid">
    ${tile('Tempo de tratamento', String(Math.floor(weeks)), 'sem', esc(`${medicationLabel(t)} (${INGREDIENT_LABEL[med.ingredient].toLowerCase()})`))}
    ${tile('Peso atual', fmt(current), 'kg', `${fmt(p.startWeightKg)} → ${fmt(p.goalWeightKg)} kg (meta)`, true)}
    ${tile('Perda acumulada', `${lost >= 0 ? '−' : '+'}${fmt(Math.abs(lostPct))}`, '%', `${lost >= 0 ? '−' : '+'}${fmt(Math.abs(lost))} kg`)}
    ${tile('Ritmo', fmt(lost / weeks, 2), 'kg/sem')}
    ${tile('IMC atual', fmt(bmiNow), '', `${BMI_LABEL[bmiClass(bmiNow)]} · Δ ${fmt(bmiNow - bmiStart)} desde o início`)}
    ${tile('Adesão à aplicação', String(adherence), '%', `${doses.length} de ${expected} doses`)}
    ${tile('Sintomas no período', String(effects.length))}
    ${tile('Proteína média/dia', fmtInt(avgProt), 'g', `meta ${goals.protein} g`)}
  </div>`);

  if (sections.has('identificacao')) {
    parts.push(`<section><h2><b>${n()}</b> Identificação</h2>
    <div class="grid four">
      ${tile('Idade', String(age), ' anos')}
      ${tile('Sexo', p.sex === 'f' ? 'Feminino' : 'Masculino')}
      ${tile('Altura', String(p.heightCm), ' cm')}
      ${tile('IMC atual', fmt(bmiNow), '', BMI_LABEL[bmiClass(bmiNow)])}
    </div>
    <p class="note">Objetivo registrado: chegar a ${fmt(p.goalWeightKg)} kg com preservação de massa magra (meta de proteína ${goals.protein} g/dia).</p></section>`);
  }

  if (sections.has('tratamento')) {
    parts.push(`<section><h2><b>${n()}</b> Tratamento e adesão</h2>
    <table class="kv">
      <tr><td>Medicamento</td><td>${esc(medicationLabel(t))} (${INGREDIENT_LABEL[med.ingredient].toLowerCase()})</td></tr>
      <tr><td>Dose atual</td><td>${fmtMg(t.doseMg)}</td></tr>
      <tr><td>Frequência</td><td>${med.frequency === 'semanal' ? `Semanal · ${WEEKDAYS_LONG[t.weekday]}` : 'Diária'} · ${t.time}</td></tr>
      <tr><td>Início do tratamento</td><td>${dt(t.startedAt)} (${Math.floor(weeks * 7)} dias)</td></tr>
      <tr><td>Adesão</td><td>${adherence}% (${doses.length} de ${expected} doses esperadas)</td></tr>
      <tr><td>Intervalo médio entre aplicações</td><td>${avgGap ? `${fmt(avgGap)} dias` : '—'}</td></tr>
      <tr><td>Próxima dose prevista</td><td>${dt(next.next.toISOString())} ${formatTime(next.next)}</td></tr>
      <tr><td>Locais de aplicação</td><td>${Object.entries(sites).map(([k, v]) => `${siteLabel(k)} (${v})`).join(', ') || '—'}</td></tr>
    </table>
    ${
      doses.length
        ? `<table><thead><tr><th>Data e hora</th><th>Dose</th><th>Local</th><th>Observações</th></tr></thead><tbody>
      ${doses.map((d) => `<tr><td>${dt(d.at)} ${formatTime(new Date(d.at))}</td><td>${fmtMg(d.mg)}</td><td>${d.site ? siteLabel(d.site) : '—'}</td><td>${esc(d.note ?? '')}</td></tr>`).join('')}
      </tbody></table>`
        : '<p class="empty">Sem aplicações registradas no período.</p>'
    }</section>`);
  }

  if (sections.has('peso')) {
    const remaining = Math.max(0, current - p.goalWeightKg);
    const progress = p.startWeightKg > p.goalWeightKg ? Math.round(((p.startWeightKg - current) / (p.startWeightKg - p.goalWeightKg)) * 100) : 0;
    const desc = [...weightsAsc].reverse();
    parts.push(`<section><h2><b>${n()}</b> Evolução de peso</h2>
    <div class="grid four">
      ${tile('Peso atual', fmt(current), 'kg', s.weights[0] ? `medido em ${dt(s.weights[0].at)}` : '', true)}
      ${tile('Perda acumulada', `${lost >= 0 ? '−' : '+'}${fmt(Math.abs(lost))}`, 'kg', `${fmt(Math.abs(lostPct))}% do peso inicial`)}
      ${tile('Falta até a meta', fmt(remaining), 'kg')}
      ${tile('Progresso', String(Math.max(0, progress)), '%', 'do caminho até a meta')}
    </div>
    ${weightSvg(weightsAsc.map((w) => ({ t: new Date(w.at).getTime(), kg: w.kg })), p.goalWeightKg)}
    <table><thead><tr><th>Data</th><th>Peso</th><th>Δ vs anterior</th></tr></thead><tbody>
    ${desc.map((w, i) => `<tr><td>${dt(w.at)}</td><td>${fmt(w.kg)} kg</td><td>${desc[i + 1] ? `${w.kg - desc[i + 1].kg > 0 ? '+' : ''}${fmt(w.kg - desc[i + 1].kg)} kg` : '—'}</td></tr>`).join('')}
    </tbody></table></section>`);
  }

  if (sections.has('medidas')) {
    const waist = s.weights.filter((w) => inP(w.at) && w.waistCm);
    parts.push(`<section><h2><b>${n()}</b> Medidas corporais</h2>
    ${
      waist.length
        ? `<table><thead><tr><th>Data</th><th>Cintura</th></tr></thead><tbody>${waist.map((w) => `<tr><td>${dt(w.at)}</td><td>${fmt(w.waistCm!, 0)} cm</td></tr>`).join('')}</tbody></table>`
        : '<p class="empty">Sem medidas corporais registradas no período.</p>'
    }</section>`);
  }

  if (sections.has('sintomas')) {
    const byKind = effects.reduce<Record<string, { n: number; sev: number }>>((acc, e) => {
      acc[e.kind] = { n: (acc[e.kind]?.n ?? 0) + 1, sev: Math.max(acc[e.kind]?.sev ?? 0, e.severity) };
      return acc;
    }, {});
    const gutLabel: Record<string, string> = { normal: 'em dia', lento: 'lento', travado: 'travado', solto: 'solto' };
    parts.push(`<section><h2><b>${n()}</b> Sintomas e efeitos adversos</h2>
    ${
      effects.length
        ? `<table><thead><tr><th>Sintoma</th><th>Ocorrências</th><th>Maior intensidade</th></tr></thead><tbody>
        ${Object.entries(byKind).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.n}</td><td>${['', 'leve', 'moderada', 'forte'][v.sev]}</td></tr>`).join('')}
        </tbody></table>`
        : '<p class="empty">Sem sintomas registrados no período.</p>'
    }
    ${
      Object.keys(gut).length
        ? `<p class="note">Intestino (check-ins diários): ${Object.entries(gut).map(([k, v]) => `${gutLabel[k]} ${v}×`).join(' · ')}</p>`
        : ''
    }</section>`);
  }

  if (sections.has('nutricao')) {
    parts.push(`<section><h2><b>${n()}</b> Nutrição e hidratação</h2>
    <div class="grid">
      ${tile('Proteína/dia', fmtInt(avgProt), 'g', `meta ${goals.protein} g · ${protDaysPct}% dos dias na meta`, true)}
      ${tile('Calorias/dia', fmtInt(avg((d) => tot(d).kcal)), 'kcal', `meta ${fmtInt(goals.kcal)} kcal`)}
      ${tile('Carboidrato/dia', fmtInt(avg((d) => tot(d).carbs)), 'g')}
      ${tile('Gordura/dia', fmtInt(avg((d) => tot(d).fat)), 'g')}
      ${tile('Fibras/dia', fmtInt(avg((d) => tot(d).fiber)), 'g', `meta ${goals.fiber} g`)}
      ${tile('Hidratação/dia', fmt(avgWater / 1000), 'L', `meta ${fmt(goals.waterMl / 1000)} L`)}
      ${tile('Refeições registradas', String(s.meals.filter((m) => inP(m.at)).length), '', `em ${mealDays.length} dias`)}
    </div>
    <p class="note">Dados de nutrição autorreportados; estimativas por foto são aproximadas.</p></section>`);
  }

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"/>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Instrument Sans', -apple-system, Helvetica, Arial, sans-serif; color: #17332B; font-size: 12px; margin: 0; }
  i { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; }
  h1, h2 { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; margin: 0; }
  h1 { font-size: 34px; line-height: 1.05; margin-top: 4px; }
  h2 { font-size: 22px; margin: 26px 0 10px; border-top: 1px solid #DCD4C4; padding-top: 14px; }
  h2 b { font-family: 'Instrument Sans', sans-serif; font-size: 11px; color: #B8744F; letter-spacing: 1.5px; margin-right: 6px; }
  header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 1px solid #DCD4C4; margin-bottom: 16px; }
  .brand { display: flex; align-items: center; gap: 8px; font-family: 'Instrument Serif', serif; font-size: 18px; }
  .kicker { font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: #B8744F; font-weight: 600; margin: 10px 0 8px; }
  .meta { text-align: right; font-size: 11px; line-height: 1.5; }
  .meta span { display: block; font-size: 9px; letter-spacing: 1.4px; text-transform: uppercase; color: #7D8A80; margin-top: 6px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .tile { border: 1px solid #E4DDCF; border-radius: 10px; padding: 10px 12px; background: #FFFDF9; break-inside: avoid; }
  .tile.hl { background: #F4F0E8; border-color: #B7C4B1; }
  .tl { font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; color: #4A5E52; font-weight: 600; }
  .tv { font-size: 22px; font-weight: 600; margin-top: 4px; }
  .tv small { font-size: 11px; font-weight: 400; color: #4A5E52; margin-left: 2px; }
  .ts { font-size: 10px; color: #4A5E52; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { text-align: left; font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; color: #7D8A80; padding: 6px 4px; border-bottom: 1px solid #DCD4C4; }
  td { padding: 7px 4px; border-bottom: 1px solid #ECE6DA; }
  table.kv td:first-child { color: #4A5E52; width: 42%; }
  .empty, .note { color: #4A5E52; font-size: 11px; }
  section { break-inside: avoid-page; }
  footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #DCD4C4; font-size: 9.5px; color: #7D8A80; line-height: 1.5; }
</style></head><body>
${parts.join('\n')}
<footer><b>Além da Caneta</b> · Relatório gerado automaticamente a partir dos registros do paciente no aplicativo, em ${dayKey(now).split('-').reverse().join('/')}. Os dados são autorreportados e podem conter imprecisões; o nível de medicamento e as estimativas nutricionais são aproximações educacionais. O app não substitui avaliação médica e nutricional — diagnósticos, prescrições e ajustes de dose são responsabilidade do profissional de saúde.</footer>
</body></html>`;
}
