'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile, getMeta } from '@/lib/storage';
import { PROGRAM, getNextWorkoutType } from '@/lib/program';
import type { Profile, ProfileMeta, WorkoutType } from '@/lib/types';
import WorkoutCard from './WorkoutCard';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meta, setMeta] = useState<ProfileMeta | null>(null);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
    setMeta(getMeta(p));
  }, [router]);

  if (!profile || !meta) return <LoadingSkeleton />;

  const recommended = getNextWorkoutType(meta.lastWorkoutType);
  const streak = meta.consecutiveDayStreak;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#15130F' }}>
      {/* Header */}
      <header className="px-5 pt-safe pb-3 flex items-center justify-between">
        <div className="animate-fade-up">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#8A8377' }}>
            Active Profile
          </p>
          <p className="scoreboard text-2xl tracking-tight" style={{ color: '#F2EDE4' }}>
            {profile.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2 animate-fade-up">
          <button
            onClick={() => router.push('/settings')}
            className="btn-ghost w-10 h-10"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path
                d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.576 3.576l1.414 1.414M13.01 13.01l1.414 1.414M3.576 14.424l1.414-1.414M13.01 4.99l1.414-1.414"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Streak banner */}
      {streak >= 5 && (
        <div
          className="mx-5 mb-3 px-4 py-2.5 rounded-xl animate-fade-up"
          style={{
            background: 'rgba(194,80,59,0.1)',
            border: '1px solid rgba(194,80,59,0.25)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: '#C2503B' }}>
            🔥 {streak} days straight — a rest day is due
          </p>
        </div>
      )}

      {/* Workout list */}
      <div className="flex-1 px-5 pb-safe flex flex-col gap-3 pt-1">
        {PROGRAM.map((workout, i) => (
          <WorkoutCard
            key={workout.type}
            type={workout.type}
            name={workout.name}
            isRecommended={workout.type === recommended}
            lastDoneDate={meta.workoutHistory[workout.type] ?? null}
            exerciseCount={workout.exercises.length}
            onTap={() => router.push(`/session/${workout.type}`)}
            stagger={Math.min(i + 1, 5)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 text-center">
        <p className="text-xs" style={{ color: '#8A8377', opacity: 0.5 }}>
          {meta.totalSessions} total session{meta.totalSessions !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-dvh px-5 pt-16 flex flex-col gap-3" style={{ background: '#15130F' }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-[76px] rounded-card animate-pulse"
          style={{ background: 'rgba(34,29,22,0.6)', borderRadius: 'var(--radius-card)' }}
        />
      ))}
    </div>
  );
}
