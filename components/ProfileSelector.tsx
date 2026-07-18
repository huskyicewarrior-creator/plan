'use client';

import { useRouter } from 'next/navigation';
import { setActiveProfile } from '@/lib/storage';
import type { Profile } from '@/lib/types';

const profiles: { id: Profile; initial: string; label: string; color: string }[] = [
  { id: 'apollo', initial: 'A', label: 'Apollo', color: '#C2793B' },
  { id: 'hunter', initial: 'H', label: 'Hunter', color: '#7A9B76' },
];

export default function ProfileSelector() {
  const router = useRouter();

  function handleSelect(profile: Profile) {
    setActiveProfile(profile);
    router.push('/home');
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 pt-safe pb-safe"
      style={{ background: '#15130F' }}
    >
      {/* Wordmark */}
      <div className="mb-14 text-center animate-fade-up">
        <p
          className="scoreboard text-6xl tracking-tight mb-1"
          style={{ color: '#C2793B' }}
        >
          OVERLOAD
        </p>
        <p
          className="text-sm tracking-[0.25em] uppercase"
          style={{ color: '#8A8377' }}
        >
          Progressive Trainer
        </p>
      </div>

      {/* Profile cards */}
      <div className="w-full max-w-sm flex flex-col gap-4 animate-fade-up stagger-1">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className="group relative w-full glass rounded-card px-8 py-7 flex items-center gap-6 text-left transition-transform duration-150 active:scale-[0.98]"
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            {/* Avatar circle */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${p.color}55, ${p.color}22)`,
                border: `1.5px solid ${p.color}44`,
                boxShadow: `0 4px 16px ${p.color}22`,
              }}
            >
              <span
                className="scoreboard text-3xl"
                style={{ color: p.color }}
              >
                {p.initial}
              </span>
            </div>

            {/* Text */}
            <div className="flex-1">
              <p
                className="scoreboard text-2xl tracking-tight"
                style={{ color: '#F2EDE4' }}
              >
                {p.label.toUpperCase()}
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: '#8A8377' }}
              >
                Tap to continue
              </p>
            </div>

            {/* Chevron */}
            <svg
              className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
              width="20" height="20" viewBox="0 0 20 20" fill="none"
            >
              <path
                d="M7.5 5l5 5-5 5"
                stroke="#8A8377"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Subtle hover highlight */}
            <div
              className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 10% 50%, ${p.color}0A 0%, transparent 60%)`,
                borderRadius: 'var(--radius-card)',
              }}
            />
          </button>
        ))}
      </div>

      <p
        className="mt-10 text-xs text-center animate-fade-up stagger-2"
        style={{ color: '#8A8377', opacity: 0.6 }}
      >
        Your data stays on this device
      </p>
    </div>
  );
}
