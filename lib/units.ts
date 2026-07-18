import type { Unit } from './types';

const LB_TO_KG = 0.453592;
const KG_TO_LB = 2.20462;

/** Display a lb-canonical weight value in the chosen unit */
export function displayWeight(lbWeight: number, unit: Unit): number {
  if (unit === 'lb') return Math.round(lbWeight * 2) / 2;
  const kg = lbWeight * LB_TO_KG;
  return Math.round(kg * 4) / 4; // nearest 0.25 kg
}

/** Format for display with unit label */
export function fmtWeight(lbWeight: number, unit: Unit): string {
  const val = displayWeight(lbWeight, unit);
  return `${val} ${unit}`;
}

/** Convert user-entered value (in chosen unit) to lb for storage */
export function toLb(value: number, unit: Unit): number {
  if (unit === 'lb') return value;
  return value * KG_TO_LB;
}

/** Display unit label */
export function unitLabel(unit: Unit): string {
  return unit;
}

/** Format seconds as mm:ss */
export function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** How long ago a date string was */
export function daysAgo(dateStr: string | null): string {
  if (!dateStr) return 'Not started';
  const then = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - then.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}
