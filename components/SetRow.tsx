'use client';

import { useState } from 'react';
import type { SetRecord, Unit } from '@/lib/types';
import { displayWeight, toLb } from '@/lib/units';

interface Props {
  setNumber: number;
  prescribedReps: number;
  prescribedWeightLb: number;
  unit: Unit;
  isLastSet: boolean;
  hasLastSetFailure: boolean;
  loggedSet: SetRecord | null;
  onLog: (set: SetRecord) => void;
}

export default function SetRow({
  setNumber, prescribedReps, prescribedWeightLb, unit,
  isLastSet, hasLastSetFailure, loggedSet, onLog,
}: Props) {
  const [reps, setReps] = useState(prescribedReps);
  const [showWeightOverride, setShowWeightOverride] = useState(false);
  const [weightOverrideRaw, setWeightOverrideRaw] = useState('');

  const displayedWeight = displayWeight(prescribedWeightLb, unit);
  const isFailureSet = isLastSet && hasLastSetFailure;
  const isLogged = loggedSet !== null;

  function handleLog() {
    const overrideLb =
      showWeightOverride && weightOverrideRaw
        ? toLb(parseFloat(weightOverrideRaw), unit)
        : prescribedWeightLb;

    onLog({ reps, weight: isNaN(overrideLb) ? prescribedWeightLb : overrideLb });
  }

  if (isLogged) {
    const loggedDisplay = displayWeight(loggedSet.weight, unit);
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(122,155,118,0.08)', border: '1px solid rgba(122,155,118,0.2)' }}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(122,155,118,0.2)', color: '#7A9B76' }}
        >
          ✓
        </span>
        <span className="text-sm font-medium flex-1" style={{ color: '#7A9B76' }}>
          Set {setNumber}
        </span>
        <span className="text-sm font-semibold" style={{ color: '#7A9B76' }}>
          {loggedSet.reps} reps
        </span>
        <span className="text-sm" style={{ color: '#7A9B76', opacity: 0.7 }}>
          @ {loggedDisplay} {unit}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(242,237,228,0.09)', background: 'rgba(21,19,15,0.35)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Set label */}
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(242,237,228,0.08)', color: '#8A8377' }}
        >
          {setNumber}
        </span>

        {/* Reps stepper */}
        <div className="flex items-center gap-2 flex-1">
          <button
            className="stepper-btn"
            onClick={() => setReps((r) => Math.max(1, r - 1))}
          >
            −
          </button>
          <div className="min-w-[3rem] text-center">
            <span className="scoreboard text-3xl" style={{ color: '#F2EDE4' }}>{reps}</span>
            <p className="text-[10px] mt-0 leading-none" style={{ color: '#8A8377' }}>
              reps
            </p>
          </div>
          <button
            className="stepper-btn"
            onClick={() => setReps((r) => Math.min(40, r + 1))}
          >
            +
          </button>
        </div>

        {/* Weight display / override */}
        <div className="flex flex-col items-end gap-1">
          {showWeightOverride ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="decimal"
                value={weightOverrideRaw}
                onChange={(e) => setWeightOverrideRaw(e.target.value)}
                placeholder={String(displayedWeight)}
                className="glass-input w-20 h-9 rounded-lg px-2 text-sm text-right"
              />
              <span className="text-xs" style={{ color: '#8A8377' }}>{unit}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowWeightOverride(true)}
              className="text-right"
            >
              <span className="text-base font-semibold" style={{ color: '#F2EDE4' }}>
                {displayedWeight}
              </span>
              <span className="text-xs ml-1" style={{ color: '#8A8377' }}>{unit}</span>
              <p className="text-[10px]" style={{ color: '#8A8377', opacity: 0.6 }}>
                tap to override
              </p>
            </button>
          )}
        </div>

        {/* Log button */}
        <button
          onClick={handleLog}
          className="btn-primary h-10 px-4 text-sm font-semibold flex-shrink-0"
        >
          Log
        </button>
      </div>

      {/* Failure set label */}
      {isFailureSet && (
        <div
          className="px-4 py-1.5 flex items-center gap-2"
          style={{
            background: 'rgba(194,121,59,0.07)',
            borderTop: '1px solid rgba(194,121,59,0.15)',
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#C2793B' }}>
            ⚡ Final set — go to failure
          </span>
        </div>
      )}
    </div>
  );
}
