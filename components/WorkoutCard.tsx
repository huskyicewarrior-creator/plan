'use client';

import type { WorkoutType } from '@/lib/types';

interface Props {
  type: WorkoutType;
  name: string;
  isRecommended: boolean;
  lastDoneDate: string | null;
  exerciseCount: number;
  onTap: () => void;
  stagger: number;
}

const DAY_ICONS: Record<WorkoutType, string> = {
  push:  '↑',
  pull:  '↓',
  legs:  '▼',
  upper: '◈',
  lower: '◎',
};

export default function WorkoutCard({
  type, name, isRecommended, lastDoneDate, exerciseCount, onTap, stagger
}: Props) {
  const ago = formatAgo(lastDoneDate);

  return (
    <button
      onClick={onTap}
      className={`group relative w-full text-left transition-transform duration-150 active:scale-[0.98] animate-fade-up stagger-${stagger}`}
    >
      <div
        className={`${isRecommended ? 'glass-accent' : 'glass'} rounded-card px-5 py-4 flex items-center gap-4`}
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        {/* Day icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{
            background: isRecommended
              ? 'rgba(194,121,59,0.18)'
              : 'rgba(242,237,228,0.05)',
            border: isRecommended
              ? '1px solid rgba(194,121,59,0.3)'
              : '1px solid rgba(242,237,228,0.08)',
            color: isRecommended ? '#C2793B' : '#8A8377',
          }}
        >
          {DAY_ICONS[type]}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="scoreboard text-xl tracking-tight"
              style={{ color: '#F2EDE4' }}
            >
              {name.toUpperCase()}
            </span>
            {isRecommended && (
              <span className="badge-recommended">NOW</span>
            )}
          </div>
          <p className="text-sm" style={{ color: '#8A8377' }}>
            {ago} · {exerciseCount} exercises
          </p>
        </div>

        {/* Chevron */}
        <svg
          className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          width="18" height="18" viewBox="0 0 18 18" fill="none"
        >
          <path
            d="M6.75 4.5l4.5 4.5-4.5 4.5"
            stroke={isRecommended ? '#C2793B' : '#8A8377'}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}

function formatAgo(dateStr: string | null): string {
  if (!dateStr) return 'Not started';
  const then = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((now.getTime() - then.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
