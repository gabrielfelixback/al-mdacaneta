import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { activityKcal, type Intensity } from '@/lib/activities';
import { dayKey, uid } from '@/lib/dates';
import { safeStorage } from './safeStorage';
import { SEED_POLLS, SEED_POSTS } from './seed';
import type {
  ActivityLog,
  CheckIn,
  DoseLog,
  MealEntry,
  ChatMessage,
  Poll,
  Post,
  ProState,
  Profile,
  Reminder,
  SideEffectLog,
  Treatment,
  WeightLog,
} from './types';

export interface AppState {
  profile: Profile | null;
  treatment: Treatment | null;
  doses: DoseLog[];
  weights: WeightLog[];
  water: Record<string, number>;
  meals: MealEntry[];
  activities: ActivityLog[];
  sideEffects: SideEffectLog[];
  checkins: Record<string, CheckIn>;
  reminders: Reminder[];
  posts: Post[];
  polls: Poll[];
  settings: { cupMl: number; healthSync: boolean };
  pro: ProState;
  chat: ChatMessage[];
  /** Perguntas ao assistente por dia (limite do plano gratuito). */
  assistantUsage: Record<string, number>;

  completeOnboarding: (p: Profile, t: Treatment, firstDose?: { at: string; mg: number }) => void;
  updateProfile: (p: Partial<Profile>) => void;
  updateTreatment: (t: Partial<Treatment>) => void;
  updateSettings: (s: Partial<AppState['settings']>) => void;

  logDose: (d: Omit<DoseLog, 'id'>) => void;
  removeDose: (id: string) => void;
  logWeight: (kg: number, at?: string, waistCm?: number) => void;
  removeWeight: (id: string) => void;
  setWater: (day: string, ml: number) => void;
  addMeal: (m: Omit<MealEntry, 'id' | 'at'>) => void;
  removeMeal: (id: string) => void;
  addActivity: (a: { day: string; typeId: string; intensity: Intensity; minutes: number; source?: 'manual' | 'saude' }) => void;
  removeActivity: (id: string) => void;
  addSideEffect: (s: Omit<SideEffectLog, 'id'>) => void;
  removeSideEffect: (id: string) => void;
  setCheckIn: (day: string, c: Partial<CheckIn>) => void;
  addReminder: (r: Omit<Reminder, 'id' | 'enabled'>) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;

  addPost: (body: string, tag?: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, body: string) => void;
  votePoll: (pollId: string, optionId: string) => void;

  setPro: (p: ProState) => void;
  addChat: (m: Omit<ChatMessage, 'id' | 'at'>) => void;
  clearChat: () => void;
  countAssistantUse: (day: string) => void;

  reset: () => void;
}

const initial = {
  profile: null,
  treatment: null,
  doses: [],
  weights: [],
  water: {},
  meals: [],
  activities: [],
  sideEffects: [],
  checkins: {},
  reminders: [],
  posts: SEED_POSTS,
  polls: SEED_POLLS,
  settings: { cupMl: 250, healthSync: false },
  pro: { active: false },
  chat: [],
  assistantUsage: {},
} satisfies Partial<AppState>;

const byDateDesc = <T extends { at: string }>(a: T, b: T) => b.at.localeCompare(a.at);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,

      completeOnboarding: (profile, treatment, firstDose) =>
        set(() => ({
          profile,
          treatment,
          weights: [{ id: uid(), at: profile.createdAt, kg: profile.startWeightKg }],
          doses: firstDose ? [{ id: uid(), medicationId: treatment.medicationId, ...firstDose }] : [],
        })),
      updateProfile: (p) => set((s) => (s.profile ? { profile: { ...s.profile, ...p } } : {})),
      updateTreatment: (t) => set((s) => (s.treatment ? { treatment: { ...s.treatment, ...t } } : {})),
      updateSettings: (x) => set((s) => ({ settings: { ...s.settings, ...x } })),

      logDose: (d) => set((s) => ({ doses: [{ id: uid(), ...d }, ...s.doses].sort(byDateDesc) })),
      removeDose: (id) => set((s) => ({ doses: s.doses.filter((d) => d.id !== id) })),

      logWeight: (kg, at = new Date().toISOString(), waistCm) =>
        set((s) => ({ weights: [{ id: uid(), at, kg, waistCm }, ...s.weights].sort(byDateDesc) })),
      removeWeight: (id) => set((s) => ({ weights: s.weights.filter((w) => w.id !== id) })),

      setWater: (day, ml) => set((s) => ({ water: { ...s.water, [day]: Math.max(0, ml) } })),

      addMeal: (m) => set((s) => ({ meals: [...s.meals, { id: uid(), at: new Date().toISOString(), ...m }] })),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      addActivity: ({ day, typeId, intensity, minutes, source = 'manual' }) => {
        const kg = currentWeight(get()) ?? 70;
        const kcal = activityKcal(typeId, intensity, minutes, kg);
        set((s) => ({
          activities: [
            ...s.activities,
            { id: uid(), day, typeId, intensity, minutes, kcal, source, at: new Date().toISOString() },
          ],
        }));
      },
      removeActivity: (id) => set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),

      addSideEffect: (x) => set((s) => ({ sideEffects: [{ id: uid(), ...x }, ...s.sideEffects].sort(byDateDesc) })),
      removeSideEffect: (id) => set((s) => ({ sideEffects: s.sideEffects.filter((x) => x.id !== id) })),

      setCheckIn: (day, c) => set((s) => ({ checkins: { ...s.checkins, [day]: { ...s.checkins[day], ...c } } })),

      addReminder: (r) => set((s) => ({ reminders: [...s.reminders, { id: uid(), enabled: true, ...r }] })),
      toggleReminder: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) })),
      removeReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

      addPost: (body, tag) =>
        set((s) => ({
          posts: [
            {
              id: uid(),
              author: s.profile?.name ?? 'Você',
              mine: true,
              at: new Date().toISOString(),
              body,
              tag,
              likes: 0,
              comments: [],
            },
            ...s.posts,
          ],
        })),
      toggleLike: (postId) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
          ),
        })),
      addComment: (postId, body) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    { id: uid(), author: s.profile?.name ?? 'Você', body, at: new Date().toISOString() },
                  ],
                }
              : p,
          ),
        })),
      votePoll: (pollId, optionId) =>
        set((s) => ({
          polls: s.polls.map((q) =>
            q.id !== pollId || q.voted
              ? q
              : {
                  ...q,
                  voted: optionId,
                  options: q.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
                },
          ),
        })),

      setPro: (pro) => set(() => ({ pro })),
      addChat: (m) => set((s) => ({ chat: [...s.chat, { id: uid(), at: new Date().toISOString(), ...m }].slice(-60) })),
      clearChat: () => set(() => ({ chat: [] })),
      countAssistantUse: (day) =>
        set((s) => ({ assistantUsage: { [day]: (s.assistantUsage[day] ?? 0) + 1 } })),

      reset: () => set(() => ({ ...initial })),
    }),
    {
      name: 'alem-da-caneta',
      version: 2,
      // v1 → v2: campos da assinatura Pro e do assistente.
      migrate: (persisted) => ({ pro: { active: false }, chat: [], assistantUsage: {}, ...(persisted as object) }) as unknown as AppState,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

// ---------- Seletores puros ----------

export function currentWeight(s: Pick<AppState, 'weights' | 'profile'>): number | undefined {
  return s.weights[0]?.kg ?? s.profile?.startWeightKg;
}

export function mealsOfDay(s: Pick<AppState, 'meals'>, day: string) {
  return s.meals.filter((m) => m.day === day);
}

export function dayTotals(meals: MealEntry[]) {
  return meals.reduce(
    (t, m) => ({
      kcal: t.kcal + m.kcal,
      protein: t.protein + m.protein,
      carbs: t.carbs + m.carbs,
      fat: t.fat + m.fat,
      fiber: t.fiber + m.fiber,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}

export function activeDays(
  s: Pick<AppState, 'meals' | 'activities' | 'water' | 'weights' | 'doses' | 'checkins'>,
): Set<string> {
  const days = new Set<string>();
  s.meals.forEach((m) => days.add(m.day));
  s.activities.forEach((a) => days.add(a.day));
  Object.entries(s.water).forEach(([d, ml]) => ml > 0 && days.add(d));
  s.weights.forEach((w) => days.add(dayKey(new Date(w.at))));
  s.doses.forEach((d) => days.add(dayKey(new Date(d.at))));
  Object.keys(s.checkins).forEach((d) => days.add(d));
  return days;
}

/** Dias seguidos com algum registro, contando a partir de hoje (ou de ontem, se hoje ainda está vazio). */
export function streak(s: AppState): number {
  const days = activeDays(s);
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
