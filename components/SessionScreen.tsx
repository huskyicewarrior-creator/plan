'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  WorkoutType, Profile, ExerciseDef, ExerciseState,
  ExercisesState, SetRecord, ProfileMeta, Unit,
} from '@/lib/types';
import {
  getActiveProfile, getExercises, getMeta, setExercises,
  setMeta, setExercise, saveDraft, loadDraft, clearDraft,
} from '@/lib/storage';
import { getWorkoutDef } from '@/lib/program';
import { computeProgression, shouldSuggestDeload } from '@/lib/algorithm';
import { fmtWeight, todayStr } from '@/lib/units';
import ExerciseBlock from './ExerciseBlock';
import RestTimer from './RestTimer';
import OnboardingModal from './OnboardingModal';

type Phase = 'loading' | 'onboarding' | 'deload-prompt' | 'session' | 'complete';

interface Props { workoutType: WorkoutType }

interface TimerState {
  active: boolean;
  timeLeft: number;
  totalTime: number;
  exerciseName: string;
}

export default function SessionScreen({ workoutType }: Props) {
  const router = useRouter();
  const workoutDef = getWorkoutDef(workoutType);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [exerciseStates, setExerciseStates] = useState<ExercisesState>({});
  const [meta, setMetaState] = useState<ProfileMeta | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [onboardingQueue, setOnboardingQueue] = useState<ExerciseDef[]>([]);
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [loggedSets, setLoggedSets] = useState<Record<string, SetRecord[]>>({});
  const [timer, setTimer] = useState<TimerState>({ active: false, timeLeft: 0, totalTime: 0, exerciseName: '' });
  const [completionResults, setCompletionResults] = useState<{ name: string; progressed: boolean; stuck: boolean }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const p = getActiveProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);

    const exercises = getExercises(p);
    const m = getMeta(p);
    setExerciseStates(exercises);
    setMetaState(m);

    // Restore draft
    const draft = loadDraft(p, workoutType);
    if (draft) setLoggedSets(draft);

    // Find exercises needing onboarding
    const queue = workoutDef.exercises.filter((e) => !exercises[e.id]);
    setOnboardingQueue(queue);

    if (queue.length > 0) {
      setPhase('onboarding');
      return;
    }

    // Check deload suggestion
    const stuckCount = workoutDef.exercises.filter((e) => exercises[e.id]?.stuckCount >= 2).length;
    const suggest = shouldSuggestDeload(m.lastDeloadDate, m.deloadIntervalWeeks, stuckCount);
    if (suggest && !m.deloadActive) {
      setPhase('deload-prompt');
      return;
    }

    setPhase('session');
  }, [workoutType, workoutDef, router]);

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timer.active) return;
    if (timer.timeLeft <= 0) {
      setTimer((t) => ({ ...t, active: false }));
      return;
    }
    timerRef.current = setTimeout(() => {
      setTimer((t) => ({ ...t, timeLeft: t.timeLeft - 1 }));
    }, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timer.active, timer.timeLeft]);

  // ── Auto-save draft when sets change ─────────────────────────────────────
  useEffect(() => {
    if (profile && phase === 'session' && Object.keys(loggedSets).length > 0) {
      saveDraft(profile, workoutType, loggedSets);
    }
  }, [loggedSets, profile, workoutType, phase]);

  // ── Onboarding ────────────────────────────────────────────────────────────
  const handleOnboardingComplete = useCallback(
    (exerciseId: string, startingWeightLb: number) => {
      if (!profile || !meta) return;
      const def = workoutDef.exercises.find((e) => e.id === exerciseId)!;
      const newState: ExerciseState = {
        displayName: def.name,
        currentWeight: startingWeightLb,
        repRange: def.repRange,
        currentRepTarget: def.repRange[0],
        lastSessionDate: null,
        stuckCount: 0,
        history: [],
      };
      setExercise(profile, exerciseId, newState);
      setExerciseStates((prev) => ({ ...prev, [exerciseId]: newState }));

      const nextIdx = onboardingIndex + 1;
      if (nextIdx >= onboardingQueue.length) {
        setPhase('session');
      } else {
        setOnboardingIndex(nextIdx);
      }
    },
    [profile, meta, workoutDef, onboardingQueue, onboardingIndex]
  );

  // ── Set logging ───────────────────────────────────────────────────────────
  const handleSetLogged = useCallback(
    (exerciseId: string, set: SetRecord, restSeconds: number, exerciseName: string) => {
      setLoggedSets((prev) => ({
        ...prev,
        [exerciseId]: [...(prev[exerciseId] ?? []), set],
      }));
      setTimer({ active: true, timeLeft: restSeconds, totalTime: restSeconds, exerciseName });
    },
    []
  );

  // ── Complete session ──────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    if (!profile || !meta) return;
    const unit = meta.unit;
    const today = todayStr();
    const updatedStates: ExercisesState = { ...exerciseStates };
    const results: { name: string; progressed: boolean; stuck: boolean }[] = [];

    workoutDef.exercises.forEach((def) => {
      const current = exerciseStates[def.id];
      const sets = loggedSets[def.id] ?? [];
      if (!current) return;
      const { newState, progressed, stuck } = computeProgression(current, sets, def, unit);
      updatedStates[def.id] = newState;
      results.push({ name: def.name, progressed, stuck });
    });

    setExercises(profile, updatedStates);

    // Update streak
    const lastDate = meta.lastStreakDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const newStreak =
      lastDate === today
        ? meta.consecutiveDayStreak
        : lastDate === yesterdayStr
        ? meta.consecutiveDayStreak + 1
        : 1;

    const newMeta: ProfileMeta = {
      ...meta,
      lastWorkoutType: workoutType,
      lastWorkoutDate: today,
      totalSessions: meta.totalSessions + 1,
      consecutiveDayStreak: newStreak,
      lastStreakDate: today,
      workoutHistory: { ...meta.workoutHistory, [workoutType]: today },
      deloadActive: false,
    };
    setMeta(profile, newMeta);
    clearDraft(profile, workoutType);
    setCompletionResults(results);
    setPhase('complete');
  }, [profile, meta, exerciseStates, loggedSets, workoutDef, workoutType]);

  // ── Deload accept/dismiss ─────────────────────────────────────────────────
  function acceptDeload() {
    if (!profile || !meta) return;
    const newMeta: ProfileMeta = {
      ...meta,
      deloadActive: true,
      deloadStartDate: todayStr(),
      lastDeloadDate: todayStr(),
    };
    setMeta(profile, newMeta);
    setMetaState(newMeta);
    setPhase('session');
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const unit: Unit = meta?.unit ?? 'lb';
  const isDeload = meta?.deloadActive ?? false;
  const allDone = workoutDef.exercises.every(
    (e) => (loggedSets[e.id]?.length ?? 0) >= (isDeload ? Math.max(1, Math.round(e.sets * 0.6)) : e.sets)
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === 'loading') return <Spinner />;

  if (phase === 'onboarding') {
    const currentExercise = onboardingQueue[onboardingIndex];
    if (!currentExercise) return <Spinner />;
    return (
      <div className="min-h-dvh" style={{ background: '#15130F' }}>
        <SessionHeader title={workoutDef.name} onBack={() => router.push('/home')} />
        <div className="px-5 pt-4 pb-4">
          <div className="glass rounded-card px-5 py-5" style={{ borderRadius: 'var(--radius-card)' }}>
            <p className="text-sm mb-2" style={{ color: '#C2793B', fontWeight: 600 }}>
              First time setup
            </p>
            <p className="text-sm" style={{ color: '#8A8377' }}>
              Answer one quick question per new exercise before you start.
            </p>
          </div>
        </div>
        <OnboardingModal
          exercise={currentExercise}
          unit={unit}
          totalInQueue={onboardingQueue.length}
          currentIndex={onboardingIndex}
          onComplete={handleOnboardingComplete}
        />
      </div>
    );
  }

  if (phase === 'deload-prompt') {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: '#15130F' }}>
        <SessionHeader title={workoutDef.name} onBack={() => router.push('/home')} />
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="glass-accent rounded-card px-6 py-8 text-center animate-scale-in w-full max-w-sm"
            style={{ borderRadius: 'var(--radius-card)' }}>
            <p className="scoreboard text-5xl mb-3" style={{ color: '#C2793B' }}>DELOAD?</p>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#8A8377' }}>
              It's been {meta?.deloadIntervalWeeks ?? 6} weeks since your last deload. A deload week cuts sets by ~40% and working weights by ~10% for one session.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPhase('session')} className="btn-ghost flex-1 h-12">
                Skip
              </button>
              <button onClick={acceptDeload} className="btn-primary flex-1 h-12">
                Yes, Deload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: '#15130F' }}>
        <SessionHeader title="Session Done" onBack={() => router.push('/home')} />
        <div className="flex-1 px-5 pb-safe pt-2 flex flex-col gap-3 overflow-y-auto">
          <div className="glass-accent rounded-card px-5 py-5 text-center animate-scale-in"
            style={{ borderRadius: 'var(--radius-card)' }}>
            <p className="scoreboard text-5xl mb-1" style={{ color: '#C2793B' }}>DONE</p>
            <p className="text-sm" style={{ color: '#8A8377' }}>
              {workoutDef.name} · {completionResults.length} exercises
            </p>
          </div>

          {completionResults.map((r, i) => (
            <div key={i} className="glass rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: r.progressed ? 'rgba(122,155,118,0.2)' : r.stuck ? 'rgba(194,80,59,0.15)' : 'rgba(242,237,228,0.06)',
                  color: r.progressed ? '#7A9B76' : r.stuck ? '#C2503B' : '#8A8377',
                }}>
                {r.progressed ? '↑' : r.stuck ? '!' : '→'}
              </div>
              <span className="text-sm flex-1" style={{ color: '#F2EDE4' }}>{r.name}</span>
              <span className="text-xs" style={{ color: r.progressed ? '#7A9B76' : r.stuck ? '#C2503B' : '#8A8377' }}>
                {r.progressed ? 'Weight up' : r.stuck ? 'Check form' : 'Same'}
              </span>
            </div>
          ))}

          <button
            onClick={() => router.push('/home')}
            className="btn-primary h-14 text-base font-semibold w-full mt-2"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main session ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#15130F' }}>
      <SessionHeader title={workoutDef.name} onBack={() => router.push('/home')} />

      {isDeload && (
        <div className="mx-5 mb-3 px-4 py-2 rounded-xl animate-fade-up"
          style={{ background: 'rgba(194,121,59,0.1)', border: '1px solid rgba(194,121,59,0.25)' }}>
          <p className="text-sm font-medium" style={{ color: '#C2793B' }}>
            Deload week — sets and weights reduced
          </p>
        </div>
      )}

      <div className="flex-1 px-5 pb-32 flex flex-col gap-4 overflow-y-auto">
        {workoutDef.exercises.map((def, i) => {
          const state = exerciseStates[def.id];
          if (!state) return null;
          return (
            <ExerciseBlock
              key={def.id}
              def={def}
              state={state}
              unit={unit}
              loggedSets={loggedSets[def.id] ?? []}
              isDeload={isDeload}
              onSetLogged={(set) => handleSetLogged(def.id, set, def.rest, def.name)}
            />
          );
        })}

        {/* Complete button */}
        {allDone && (
          <button
            onClick={handleComplete}
            className="btn-primary w-full h-14 text-base font-semibold animate-scale-in"
          >
            ✓ Complete Session
          </button>
        )}
      </div>

      {/* Rest timer */}
      <RestTimer
        timeLeft={timer.timeLeft}
        totalTime={timer.totalTime}
        active={timer.active}
        exerciseName={timer.exerciseName}
        onSkip={() => setTimer((t) => ({ ...t, active: false, timeLeft: 0 }))}
        onAddThirty={() => setTimer((t) => ({ ...t, timeLeft: t.timeLeft + 30, totalTime: t.totalTime + 30 }))}
      />
    </div>
  );
}

function SessionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="px-5 pt-safe pb-3 flex items-center gap-4">
      <button onClick={onBack} className="btn-ghost w-10 h-10 flex-shrink-0" aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11.25 13.5L6.75 9l4.5-4.5" stroke="currentColor" strokeWidth="1.75"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <h1 className="scoreboard text-3xl tracking-tight" style={{ color: '#F2EDE4' }}>
        {title.toUpperCase()}
      </h1>
    </header>
  );
}

function Spinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: '#15130F' }}>
      <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: '#C2793B', borderRightColor: 'rgba(194,121,59,0.3)' }}/>
    </div>
  );
}
