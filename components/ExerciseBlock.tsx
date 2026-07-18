'use client';

import { useState } from 'react';
import type { ExerciseDef, ExerciseState, SetRecord, Unit } from '@/lib/types';
import { displayWeight, fmtWeight } from '@/lib/units';
import { formatRest } from '@/lib/program';
import SetRow from './SetRow';

interface Props {
  def: ExerciseDef;
  state: ExerciseState;
  unit: Unit;
  loggedSets: SetRecord[];
  isDeload: boolean;
  onSetLogged: (set: SetRecord) => void;
}

export default function ExerciseBlock({
  def, state, unit, loggedSets, isDeload, onSetLogged,
}: Props) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [warmupChecked, setWarmupChecked] = useState(false);

  const displaySets = isDeload ? Math.max(1, Math.round(def.sets * 0.6)) : def.sets;
  const displayWeightLb = isDeload ? state.currentWeight * 0.9 : state.currentWeight;
  const [repMin] = state.repRange;

  const isStuck = state.stuckCount >= 2;
  const allSetsLogged = loggedSets.length >= displaySets;

  return (
    <div className="glass rounded-card animate-fade-up" style={{ borderRadius: 'var(--radius-card)' }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        {/* Name row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold leading-tight" style={{ color: '#F2EDE4' }}>
            {def.name}
          </h3>
          {isStuck && (
            <span className="badge-stuck flex-shrink-0">⚠ Stuck</span>
          )}
        </div>

        {/* Meta row */}
        <p className="text-xs mb-4" style={{ color: '#8A8377' }}>
          {displaySets} sets · {formatRest(def.rest)} rest · {def.effort}
          {isDeload && <span style={{ color: '#C2793B' }}> · DELOAD</span>}
        </p>

        {/* ── Scoreboard ─────────────────────────────────── */}
        <div className="flex items-end gap-4 mb-4">
          <div>
            <div className="flex items-end gap-2 leading-none">
              <span className="scoreboard" style={{ fontSize: '56px', color: '#F2EDE4' }}>
                {displayWeight(displayWeightLb, unit)}
              </span>
              <span
                className="scoreboard mb-1.5"
                style={{ fontSize: '22px', color: '#8A8377' }}
              >
                {unit}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="scoreboard text-3xl"
                style={{ color: '#C2793B' }}
              >
                × {state.currentRepTarget}
              </span>
              <span className="text-sm" style={{ color: '#8A8377' }}>
                ({state.repRange[0]}–{state.repRange[1]} range)
              </span>
            </div>
          </div>

          {/* Completion indicator */}
          {allSetsLogged && (
            <div
              className="ml-auto mb-1 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(122,155,118,0.2)', border: '1.5px solid rgba(122,155,118,0.4)' }}
            >
              <span style={{ color: '#7A9B76', fontSize: '18px' }}>✓</span>
            </div>
          )}
        </div>

        {/* ── Cue ─────────────────────────────────────────── */}
        <div className="divider mb-3" />
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-relaxed flex-1" style={{ color: '#8A8377' }}>
            {def.cue}
          </p>
          <button
            onClick={() => setWhyOpen((o) => !o)}
            className="btn-ghost h-7 px-3 text-xs flex-shrink-0"
          >
            {whyOpen ? 'Close' : 'Why?'}
          </button>
        </div>

        {/* Why expanded */}
        {whyOpen && (
          <div
            className="mt-3 px-4 py-3 rounded-xl text-sm leading-relaxed animate-fade-up"
            style={{
              background: 'rgba(242,237,228,0.04)',
              border: '1px solid rgba(242,237,228,0.07)',
              color: '#8A8377',
            }}
          >
            {def.why}
          </div>
        )}

        {/* Stuck message */}
        {isStuck && (
          <div
            className="mt-3 px-4 py-2.5 rounded-xl text-xs"
            style={{
              background: 'rgba(194,80,59,0.08)',
              border: '1px solid rgba(194,80,59,0.2)',
              color: '#C2503B',
            }}
          >
            Stuck for {state.stuckCount} sessions — check form, try a technique reset, or consider a deload week.
          </div>
        )}
      </div>

      {/* ── Warmup checklist ─────────────────────────────── */}
      {def.warmupSets && (
        <div
          className="mx-5 mb-4 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(242,237,228,0.03)',
            border: '1px solid rgba(242,237,228,0.07)',
          }}
        >
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="glass-checkbox"
              checked={warmupChecked}
              onChange={(e) => setWarmupChecked(e.target.checked)}
            />
            <span className="text-sm" style={{ color: warmupChecked ? '#7A9B76' : '#8A8377' }}>
              Warm-up sets complete
              <span
                className="block text-xs mt-0.5 leading-none"
                style={{ color: warmupChecked ? 'rgba(122,155,118,0.6)' : 'rgba(138,131,119,0.6)' }}
              >
                Empty bar + light set at ~50% ({fmtWeight(displayWeightLb * 0.5, unit)})
              </span>
            </span>
          </label>
        </div>
      )}

      {/* ── Sets ──────────────────────────────────────────── */}
      <div className="px-5 pb-5 flex flex-col gap-2.5">
        {[...Array(displaySets)].map((_, i) => (
          <SetRow
            key={i}
            setNumber={i + 1}
            prescribedReps={state.currentRepTarget}
            prescribedWeightLb={displayWeightLb}
            unit={unit}
            isLastSet={i === displaySets - 1}
            hasLastSetFailure={!!def.lastSetFailure}
            loggedSet={loggedSets[i] ?? null}
            onLog={onSetLogged}
          />
        ))}
      </div>
    </div>
  );
}
