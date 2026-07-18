export type WorkoutType = 'push' | 'pull' | 'legs' | 'upper' | 'lower';
export type Profile = 'apollo' | 'hunter';
export type Unit = 'lb' | 'kg';

export interface SetRecord {
  reps: number;
  weight: number; // always stored in lb (canonical)
}

export interface SessionRecord {
  date: string;
  sets: SetRecord[];
}

export interface ExerciseState {
  displayName: string;
  currentWeight: number; // lb canonical
  repRange: [number, number];
  currentRepTarget: number;
  lastSessionDate: string | null;
  stuckCount: number;
  history: SessionRecord[];
}

export interface ExercisesState {
  [exerciseId: string]: ExerciseState;
}

export interface ProfileMeta {
  lastWorkoutType: WorkoutType | null;
  lastWorkoutDate: string | null;
  unit: Unit;
  deloadActive: boolean;
  deloadStartDate: string | null;
  lastDeloadDate: string | null;
  totalSessions: number;
  consecutiveDayStreak: number;
  lastStreakDate: string | null;
  workoutHistory: Partial<Record<WorkoutType, string>>;
  deloadIntervalWeeks: number;
}

export interface ExerciseDef {
  id: string;
  name: string;
  sets: number;
  repRange: [number, number];
  effort: string;
  rest: number; // seconds
  cue: string;
  why: string;
  increment: { lb: number; kg: number };
  warmupSets?: boolean;
  lastSetFailure?: boolean;
}

export interface WorkoutDef {
  type: WorkoutType;
  name: string;
  exercises: ExerciseDef[];
}

export interface ProgressionResult {
  newState: ExerciseState;
  progressed: boolean;
  stuck: boolean;
}
