'use client';

import { useState, useRef, useEffect } from 'react';
import type { ExerciseDef, Unit } from '@/lib/types';
import { displayWeight, toLb } from '@/lib/units';

interface Props {
  exercise: ExerciseDef;
  unit: Unit;
  totalInQueue: number;
  currentIndex: number;
  onComplete: (exerciseId: string, startingWeightLb: number) => void;
}

export default function OnboardingModal({
  exercise, unit, totalInQueue, currentIndex, onComplete,
}: Props) {
  const [rawValue, setRawValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [exercise.id]);

  function handleSubmit() {
    const num = parseFloat(rawValue);
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid weight');
      return;
    }
    setError('');
    onComplete(exercise.id, toLb(num, unit));
    setRawValue('');
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  const isBodyweight = exercise.id === 'tibialis_raise' || exercise.id === 'hanging_leg_raise';

  return (
    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 60 }}>
      <div
        className="glass w-full max-w-md mx-auto animate-scale-in rounded-t-[28px] px-6 pt-6 pb-8"
        style={{ borderRadius: '28px 28px 0 0' }}
      >
        {/* Queue indicator */}
        {totalInQueue > 1 && (
          <p className="text-xs mb-4 text-center" style={{ color: '#8A8377' }}>
            Exercise {currentIndex + 1} of {totalInQueue}
          </p>
        )}

        {/* Progress dots */}
        {totalInQueue > 1 && (
          <div className="flex justify-center gap-1.5 mb-5">
            {[...Array(totalInQueue)].map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? 20 : 6,
                  background: i <= currentIndex ? '#C2793B' : 'rgba(242,237,228,0.15)',
                }}
              />
            ))}
          </div>
        )}

        {/* Exercise name */}
        <h2
          className="scoreboard text-2xl mb-2 leading-tight"
          style={{ color: '#F2EDE4' }}
        >
          {exercise.name.toUpperCase()}
        </h2>

        {/* Question */}
        <p className="text-base mb-6 leading-relaxed" style={{ color: '#8A8377' }}>
          {isBodyweight
            ? `What weight can you do for ${exercise.repRange[0]} reps at a hard-but-not-max effort? Enter 0 if bodyweight only.`
            : `What weight can you currently do for about ${exercise.repRange[0]} reps at a hard-but-not-max effort?`}
        </p>

        {/* Input row */}
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                min={0}
                step={unit === 'lb' ? 5 : 2.5}
                value={rawValue}
                onChange={(e) => {
                  setRawValue(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={handleKey}
                placeholder={unit === 'lb' ? '135' : '60'}
                className="glass-input w-full h-14 rounded-xl px-4 text-xl font-semibold pr-16"
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: '#8A8377' }}
              >
                {unit}
              </span>
            </div>
            {error && (
              <p className="text-xs mt-1.5" style={{ color: '#C2503B' }}>{error}</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="btn-primary h-14 px-6 text-base font-semibold"
          >
            {currentIndex + 1 < totalInQueue ? 'Next →' : 'Start'}
          </button>
        </div>

        {/* Range hint */}
        <p className="text-xs mt-4" style={{ color: '#8A8377', opacity: 0.7 }}>
          Target rep range: {exercise.repRange[0]}–{exercise.repRange[1]} reps · {exercise.effort}
        </p>
      </div>
    </div>
  );
}
