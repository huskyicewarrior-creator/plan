import type {
  Profile,
  ExerciseState,
  ExercisesState,
  ProfileMeta,
  WorkoutType,
  SetRecord,
  Unit,
} from './types';

const STORAGE_VERSION = '1';

function k(profile: Profile, suffix: string): string {
  return `trainer:${profile}:${suffix}`;
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── Profile ──────────────────────────────────────────────────────────────────

export function getActiveProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trainer:profile') as Profile | null;
}

export function setActiveProfile(profile: Profile): void {
  localStorage.setItem('trainer:profile', profile);
}

export function clearActiveProfile(): void {
  localStorage.removeItem('trainer:profile');
}

// ── Exercises ─────────────────────────────────────────────────────────────────

export function getExercises(profile: Profile): ExercisesState {
  return safeGet<ExercisesState>(k(profile, 'exercises'), {});
}

export function setExercises(profile: Profile, data: ExercisesState): void {
  localStorage.setItem(k(profile, 'exercises'), JSON.stringify(data));
}

export function getExercise(profile: Profile, id: string): ExerciseState | null {
  const all = getExercises(profile);
  return all[id] ?? null;
}

export function setExercise(profile: Profile, id: string, state: ExerciseState): void {
  const all = getExercises(profile);
  all[id] = state;
  setExercises(profile, all);
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const defaultMeta = (): ProfileMeta => ({
  lastWorkoutType: null,
  lastWorkoutDate: null,
  unit: 'lb',
  deloadActive: false,
  deloadStartDate: null,
  lastDeloadDate: null,
  totalSessions: 0,
  consecutiveDayStreak: 0,
  lastStreakDate: null,
  workoutHistory: {},
  deloadIntervalWeeks: 6,
});

export function getMeta(profile: Profile): ProfileMeta {
  const stored = safeGet<Partial<ProfileMeta>>(k(profile, 'meta'), {});
  return { ...defaultMeta(), ...stored };
}

export function setMeta(profile: Profile, data: ProfileMeta): void {
  localStorage.setItem(k(profile, 'meta'), JSON.stringify(data));
}

export function updateMeta(profile: Profile, patch: Partial<ProfileMeta>): ProfileMeta {
  const current = getMeta(profile);
  const next = { ...current, ...patch };
  setMeta(profile, next);
  return next;
}

// ── Draft (in-progress session) ───────────────────────────────────────────────

export function saveDraft(
  profile: Profile,
  workoutType: WorkoutType,
  loggedSets: Record<string, SetRecord[]>
): void {
  localStorage.setItem(k(profile, `draft:${workoutType}`), JSON.stringify(loggedSets));
}

export function loadDraft(
  profile: Profile,
  workoutType: WorkoutType
): Record<string, SetRecord[]> | null {
  return safeGet<Record<string, SetRecord[]> | null>(k(profile, `draft:${workoutType}`), null);
}

export function clearDraft(profile: Profile, workoutType: WorkoutType): void {
  localStorage.removeItem(k(profile, `draft:${workoutType}`));
}

// ── Unit helpers ──────────────────────────────────────────────────────────────

export function getUnit(profile: Profile): Unit {
  return getMeta(profile).unit;
}

// ── Import / Export ───────────────────────────────────────────────────────────

export function exportData(profile: Profile): string {
  return JSON.stringify(
    {
      version: STORAGE_VERSION,
      profile,
      exportedAt: new Date().toISOString(),
      exercises: getExercises(profile),
      meta: getMeta(profile),
    },
    null,
    2
  );
}

export function importData(profile: Profile, jsonString: string): void {
  const data = JSON.parse(jsonString) as {
    exercises?: ExercisesState;
    meta?: Partial<ProfileMeta>;
  };
  if (data.exercises) setExercises(profile, data.exercises);
  if (data.meta) setMeta(profile, { ...defaultMeta(), ...data.meta });
}

// ── Reset ─────────────────────────────────────────────────────────────────────

export function resetProfile(profile: Profile): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`trainer:${profile}:`)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
