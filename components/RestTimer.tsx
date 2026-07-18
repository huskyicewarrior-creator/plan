'use client';

import { useEffect, useRef } from 'react';
import { fmtTime } from '@/lib/units';

interface Props {
  timeLeft: number;
  totalTime: number;
  active: boolean;
  exerciseName: string;
  onSkip: () => void;
  onAddThirty: () => void;
}

export default function RestTimer({
  timeLeft, totalTime, active, exerciseName, onSkip, onAddThirty,
}: Props) {
  if (!active && timeLeft === 0) return null;

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 1;
  const pct = Math.min(progress, 1);
  const isLowTime = timeLeft <= 10 && active;

  // SVG arc
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pb-safe animate-fade-up"
      style={{ zIndex: 40 }}
    >
      <div
        className="glass mx-3 mb-3 rounded-[18px] px-5 py-4"
        style={{
          borderColor: 'rgba(194,121,59,0.25)',
          background: 'rgba(21,17,12,0.88)',
        }}
      >
        {/* Progress bar */}
        <div
          className="w-full h-0.5 rounded-full mb-3 overflow-hidden"
          style={{ background: 'rgba(242,237,228,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 linear"
            style={{
              width: `${pct * 100}%`,
              background: isLowTime ? '#C2503B' : '#C2793B',
            }}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* SVG ring */}
          <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0 -rotate-90">
            <circle cx="22" cy="22" r={r} fill="none" strokeWidth="2.5" className="progress-ring-track"/>
            <circle
              cx="22" cy="22" r={r}
              fill="none"
              strokeWidth="2.5"
              className="progress-ring-fill"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              stroke={isLowTime ? '#C2503B' : '#C2793B'}
            />
          </svg>

          {/* Timer text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className={`scoreboard text-4xl ${isLowTime ? 'animate-timer-pulse' : ''}`}
                style={{ color: isLowTime ? '#C2503B' : '#F2EDE4' }}
              >
                {fmtTime(timeLeft)}
              </span>
              <span className="text-sm" style={{ color: '#8A8377' }}>rest</span>
            </div>
            <p
              className="text-xs truncate"
              style={{ color: '#8A8377', opacity: 0.7 }}
            >
              {exerciseName}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onAddThirty}
              className="btn-ghost h-9 px-3 text-sm"
            >
              +30s
            </button>
            <button
              onClick={onSkip}
              className="btn-primary h-9 px-4 text-sm"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
