import type { DoseLog, Treatment } from '@/store/types';
import { medicationLevelAt, type DosePoint } from './calc';
import { getMedication, HALF_LIFE_HOURS } from './medications';

export function medicationLabel(t: Pick<Treatment, 'medicationId' | 'brandName'>): string {
  const med = getMedication(t.medicationId);
  if (med.customName && t.brandName?.trim()) return t.brandName.trim();
  return med.name;
}

function atTime(d: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const r = new Date(d);
  r.setHours(h || 0, m || 0, 0, 0);
  return r;
}

export interface NextDoseInfo {
  next: Date;
  last?: DoseLog;
  intervalMs: number;
  /** 0..1 do intervalo já percorrido desde a última aplicação. */
  progress: number;
  overdue: boolean;
}

export function nextDoseInfo(t: Treatment, doses: DoseLog[], now = new Date()): NextDoseInfo {
  const med = getMedication(t.medicationId);
  const intervalDays = med.frequency === 'diaria' ? 1 : 7;
  const intervalMs = intervalDays * 86_400_000;
  const last = doses[0];

  let next: Date;
  if (last) {
    const base = new Date(last.at);
    base.setDate(base.getDate() + intervalDays);
    next = atTime(base, t.time);
  } else if (med.frequency === 'diaria') {
    next = atTime(now, t.time);
  } else {
    const d = new Date(now);
    d.setDate(d.getDate() + ((t.weekday - d.getDay() + 7) % 7));
    next = atTime(d, t.time);
  }

  const progress = last
    ? Math.min(1, Math.max(0, (now.getTime() - new Date(last.at).getTime()) / intervalMs))
    : 0;
  return { next, last, intervalMs, progress, overdue: next.getTime() <= now.getTime() };
}

export function dosePoints(doses: DoseLog[]): DosePoint[] {
  return doses.map((d) => ({ at: d.at, mg: d.mg, ingredient: getMedication(d.medicationId).ingredient }));
}

export interface LevelSeriesPoint {
  date: Date;
  mg: number;
}

/** Série diária do nível estimado: `back` dias passados até `ahead` dias à frente. */
export function levelSeries(doses: DoseLog[], back: number, ahead: number, now = new Date()): LevelSeriesPoint[] {
  const pts = dosePoints(doses);
  const out: LevelSeriesPoint[] = [];
  for (let i = -back; i <= ahead; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    out.push({ date: d, mg: medicationLevelAt(pts, d) });
  }
  return out;
}

export function currentLevel(doses: DoseLog[], now = new Date()) {
  const mg = medicationLevelAt(dosePoints(doses), now);
  const ref = doses[0]?.mg ?? 0;
  return { mg, pct: ref ? Math.min(100, Math.round((mg / ref) * 100)) : 0 };
}

export function halfLifeLabel(medicationId: string): string {
  const h = HALF_LIFE_HOURS[getMedication(medicationId).ingredient];
  return h >= 48 ? `~${Math.round(h / 24)} dias` : `~${h} horas`;
}

export function treatmentWeek(t: Treatment, now = new Date()): number {
  const diff = now.getTime() - new Date(t.startedAt).getTime();
  return Math.max(1, Math.floor(diff / (7 * 86_400_000)) + 1);
}
