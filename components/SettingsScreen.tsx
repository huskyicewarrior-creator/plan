'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile, Unit } from '@/lib/types';
import {
  getActiveProfile, getMeta, updateMeta, clearActiveProfile,
  exportData, importData, resetProfile, setActiveProfile,
} from '@/lib/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unit, setUnit] = useState<Unit>('lb');
  const [deloadWeeks, setDeloadWeeks] = useState(6);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
    const m = getMeta(p);
    setUnit(m.unit);
    setDeloadWeeks(m.deloadIntervalWeeks);
  }, [router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function handleUnitChange(next: Unit) {
    if (!profile) return;
    setUnit(next);
    updateMeta(profile, { unit: next });
    showToast(`Units set to ${next}`);
  }

  function handleDeloadWeeksChange(v: number) {
    if (!profile) return;
    const clamped = Math.max(2, Math.min(16, v));
    setDeloadWeeks(clamped);
    updateMeta(profile, { deloadIntervalWeeks: clamped });
  }

  function handleExport() {
    if (!profile) return;
    const json = exportData(profile);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overload-${profile}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(profile, reader.result as string);
        showToast('Data imported — reload to see changes');
        window.location.reload();
      } catch {
        showToast('Import failed — invalid file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleSwitchProfile() {
    clearActiveProfile();
    router.replace('/');
  }

  function handleResetData() {
    if (!profile) return;
    if (!window.confirm(`Reset all data for ${profile}? This cannot be undone.`)) return;
    resetProfile(profile);
    showToast('All data reset');
    router.push('/home');
  }

  if (!profile) return null;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#15130F' }}>
      {/* Header */}
      <header className="px-5 pt-safe pb-3 flex items-center gap-4">
        <button
          onClick={() => router.push('/home')}
          className="btn-ghost w-10 h-10 flex-shrink-0"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.25 13.5L6.75 9l4.5-4.5" stroke="currentColor" strokeWidth="1.75"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="scoreboard text-3xl tracking-tight" style={{ color: '#F2EDE4' }}>
          SETTINGS
        </h1>
      </header>

      <div className="flex-1 px-5 pb-safe flex flex-col gap-4 overflow-y-auto pt-1">

        {/* Profile section */}
        <Section title="Profile">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F2EDE4' }}>
                {profile.charAt(0).toUpperCase() + profile.slice(1)}
              </p>
              <p className="text-xs" style={{ color: '#8A8377' }}>Active profile on this device</p>
            </div>
            <button onClick={handleSwitchProfile} className="btn-ghost h-9 px-4 text-sm">
              Switch
            </button>
          </div>
        </Section>

        {/* Units section */}
        <Section title="Units">
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(242,237,228,0.1)' }}
          >
            {(['lb', 'kg'] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className="flex-1 h-12 text-sm font-semibold transition-all duration-150"
                style={{
                  background: unit === u ? '#C2793B' : 'rgba(21,19,15,0.3)',
                  color: unit === u ? '#F2EDE4' : '#8A8377',
                }}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: '#8A8377', opacity: 0.7 }}>
            Weights are stored in lb internally and converted for display. Switching units won't change your stored progress.
          </p>
        </Section>

        {/* Program section */}
        <Section title="Program">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>
                Deload every
              </p>
              <p className="text-xs" style={{ color: '#8A8377' }}>
                Weeks before a deload is suggested
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="stepper-btn w-9 h-9"
                onClick={() => handleDeloadWeeksChange(deloadWeeks - 1)}
              >−</button>
              <span className="scoreboard text-2xl w-8 text-center" style={{ color: '#F2EDE4' }}>
                {deloadWeeks}
              </span>
              <button
                className="stepper-btn w-9 h-9"
                onClick={() => handleDeloadWeeksChange(deloadWeeks + 1)}
              >+</button>
            </div>
          </div>
        </Section>

        {/* Data section */}
        <Section title="Data">
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleExport}
              className="w-full h-12 rounded-xl text-sm font-semibold text-left px-4 transition-colors duration-150"
              style={{
                background: 'rgba(242,237,228,0.05)',
                border: '1px solid rgba(242,237,228,0.1)',
                color: '#F2EDE4',
              }}
            >
              ↑ Export data (JSON)
            </button>
            <button
              onClick={handleImportClick}
              className="w-full h-12 rounded-xl text-sm font-semibold text-left px-4 transition-colors duration-150"
              style={{
                background: 'rgba(242,237,228,0.05)',
                border: '1px solid rgba(242,237,228,0.1)',
                color: '#F2EDE4',
              }}
            >
              ↓ Import data (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: '#8A8377', opacity: 0.7 }}>
            Since there's no server, export regularly to back up your progress.
          </p>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <button
            onClick={handleResetData}
            className="w-full h-12 rounded-xl text-sm font-semibold"
            style={{
              background: 'rgba(194,80,59,0.1)',
              border: '1px solid rgba(194,80,59,0.3)',
              color: '#C2503B',
            }}
          >
            Reset all data for {profile}
          </button>
        </Section>

        <p className="text-xs text-center pb-4" style={{ color: '#8A8377', opacity: 0.4 }}>
          Overload Trainer v1 · No cloud · No cost
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-pill text-sm font-medium animate-scale-in"
          style={{
            background: 'rgba(34,29,22,0.95)',
            border: '1px solid rgba(242,237,228,0.15)',
            color: '#F2EDE4',
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap',
            zIndex: 99,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-card px-5 py-4 animate-fade-up" style={{ borderRadius: 'var(--radius-card)' }}>
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em] mb-4"
        style={{ color: '#C2793B' }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
