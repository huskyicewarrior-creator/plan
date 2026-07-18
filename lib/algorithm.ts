import type { ExerciseState, ExerciseDef, SetRecord, Unit, ProgressionResult } from './types';
import { todayStr } from './units';

const KG_TO_LB = 2.20462;

export function computeProgression(
  current: ExerciseState,
  sessionSets: SetRecord[],
  def: ExerciseDef,
  unit: Unit
): ProgressionResult {
  const [min, max] = current.repRange;
  const today = todayStr();

  // Weight increment stored in lb (canonical)
  const increment = unit === 'lb' ? def.increment.lb : def.increment.kg * KG_TO_LB;

  const validSets = sessionSets.filter((s) => s.reps > 0);
  if (validSets.length === 0) {
    return {
      newState: { ...current, lastSessionDate: today, history: [...current.history, { date: today, sets: sessionSets }] },
      progressed: false,
      stuck: current.stuckCount >= 2,
    };
  }

  const allHitTop = validSets.every((s) => s.reps >= max);
  const anyMissedBottom = validSets.some((s) => s.reps < min);

  let newWeight = current.currentWeight;
  let newRepTarget = current.currentRepTarget;
  let newStuckCount = current.stuckCount;
  let progressed = false;

  if (allHitTop) {
    // Progress: increase weight, reset rep target to bottom of range
    newWeight = parseFloat((current.currentWeight + increment).toFixed(2));
    newRepTarget = min;
    newStuckCount = 0;
    progressed = true;
  } else if (!anyMissedBottom) {
    // In range but not all at top — nudge rep target up
    const canIncrease = current.currentRepTarget < max;
    if (canIncrease) {
      newRepTarget = current.currentRepTarget + 1;
      newStuckCount = 0; // still making progress
    } else {
      // Rep target already maxed out and can't hit it → stalling
      newStuckCount = current.stuckCount + 1;
    }
  } else {
    // Missed the bottom on at least one set — no progression
    newStuckCount = current.stuckCount + 1;
  }

  const stuck = newStuckCount >= 2;

  const newState: ExerciseState = {
    ...current,
    currentWeight: newWeight,
    currentRepTarget: newRepTarget,
    stuckCount: newStuckCount,
    lastSessionDate: today,
    history: [
      ...current.history,
      { date: today, sets: validSets },
    ],
  };

  return { newState, progressed, stuck };
}

export function applyDeload(current: ExerciseState): ExerciseState {
  return {
    ...current,
    currentWeight: parseFloat((current.currentWeight * 0.9).toFixed(2)),
    // Don't reset stuckCount here — keep the flag for visibility
  };
}

export function shouldSuggestDeload(
  lastDeloadDate: string | null,
  deloadIntervalWeeks: number,
  stuckExerciseCount: number
): boolean {
  if (stuckExerciseCount >= 2) return true;
  if (!lastDeloadDate) return false;
  const then = new Date(lastDeloadDate + 'T00:00:00');
  const now = new Date();
  const weeksElapsed = (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24 * 7);
  return weeksElapsed >= deloadIntervalWeeks;
}
