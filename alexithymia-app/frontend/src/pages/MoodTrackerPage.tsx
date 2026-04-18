import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface MoodEntry {
  id: number;
  date: string; // "YYYY-MM-DD"
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
}

const MOODS = [
  { level: 1 as const, emoji: '😞', label: 'Rough', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.45)' },
  { level: 2 as const, emoji: '😕', label: 'Meh',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.45)' },
  { level: 3 as const, emoji: '😐', label: 'Okay',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.45)' },
  { level: 4 as const, emoji: '🙂', label: 'Good',  color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.45)' },
  { level: 5 as const, emoji: '😄', label: 'Great', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)',  border: 'rgba(244,63,94,0.45)' },
];

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function loadEntries(): MoodEntry[] {
  try {
    return JSON.parse(localStorage.getItem('mood_entries') || '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries: MoodEntry[]) {
  localStorage.setItem('mood_entries', JSON.stringify(entries));
}

/** In-app banner only—no browser Notification API. */
const ROUTINE_STORAGE_KEY = 'mood_routine_reminders_enabled';
const ROUTINE_BANNER_DISMISSED_KEY = 'mood_routine_reminders_banner_dismissed';

function loadRoutineEnabled(): boolean {
  try {
    return localStorage.getItem(ROUTINE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveRoutineEnabled(enabled: boolean) {
  localStorage.setItem(ROUTINE_STORAGE_KEY, enabled ? 'true' : 'false');
}

function loadBannerDismissed(): boolean {
  try {
    return localStorage.getItem(ROUTINE_BANNER_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveBannerDismissed(dismissed: boolean) {
  localStorage.setItem(ROUTINE_BANNER_DISMISSED_KEY, dismissed ? 'true' : 'false');
}

function calcStreak(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0;
  const dateSet = new Set(entries.map((e) => e.date));
  const today = toDateKey(new Date());
  const startDay = dateSet.has(today) ? new Date() : (() => {
    const y = new Date(); y.setDate(y.getDate() - 1); return y;
  })();

  let streak = 0;
  const cursor = new Date(startDay);
  while (dateSet.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function calcLongest(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...new Set(entries.map((e) => e.date))].sort();
  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else current = 1;
  }
  return longest;
}

export default function MoodTrackerPage() {
  const [entries, setEntries]     = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<1|2|3|4|5|null>(null);
  const [note, setNote]           = useState('');
  const [saved, setSaved]         = useState(false);
  const [routineRemindersEnabled, setRoutineRemindersEnabled] = useState(loadRoutineEnabled);
  const [routineBannerDismissed, setRoutineBannerDismissed] = useState(loadBannerDismissed);

  const today = toDateKey(new Date());
  const now   = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthName   = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const loaded = loadEntries();
    setEntries(loaded);
    const todayEntry = loaded.find((e) => e.date === today);
    if (todayEntry) {
      setSelectedMood(todayEntry.mood);
      setNote(todayEntry.note);
    }
  }, [today]);

  const setRoutineEnabled = (enabled: boolean) => {
    setRoutineRemindersEnabled(enabled);
    saveRoutineEnabled(enabled);
    if (enabled) {
      setRoutineBannerDismissed(false);
      saveBannerDismissed(false);
    }
  };

  const dismissRoutineBanner = () => {
    setRoutineBannerDismissed(true);
    saveBannerDismissed(true);
  };

  const todayEntry    = entries.find((e) => e.date === today);
  const alreadySaved  = !!todayEntry;
  const streak        = calcStreak(entries);
  const longestStreak = calcLongest(entries);

  const recordedDates = new Set(entries.map((e) => e.date));

  const moodCounts = MOODS.map((m) => ({
    ...m,
    count: entries.filter(
      (e) => e.mood === m.level &&
             new Date(e.date).getMonth() === now.getMonth() &&
             new Date(e.date).getFullYear() === now.getFullYear()
    ).length,
  }));
  const maxCount = Math.max(...moodCounts.map((m) => m.count), 1);

  const handleRecord = () => {
    if (!selectedMood) return;
    const next = entries.filter((e) => e.date !== today);
    const entry: MoodEntry = { id: Date.now(), date: today, mood: selectedMood, note };
    const updated = [entry, ...next];
    setEntries(updated);
    saveEntries(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const streakBadge = streak === 0
    ? 'Start today!'
    : streak < 3  ? 'Getting started'
    : streak < 7  ? 'Building momentum'
    : streak < 14 ? '🚀 Keep it up!'
    : streak < 30 ? '🚀 On fire!'
    : '🏆 Legendary!';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 grid grid-cols-3 items-center gap-2">
        <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors justify-self-start">
          ← Home
        </Link>
        <h1 className="text-lg font-semibold text-white justify-self-center text-center min-w-0">
          Mood Tracker
        </h1>
        <div className="justify-self-end w-full flex justify-end">
          <Link
            to="/journal"
            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Journal →
          </Link>
        </div>
      </div>

      {routineRemindersEnabled && !alreadySaved && (
        <div
          className="px-4 py-3 text-center text-sm border-b border-indigo-500/25"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#c7d2fe' }}
          role="status"
        >
          Daily check-in: log today&apos;s mood below to stay on track—no pop-up alerts, just this reminder.
        </div>
      )}

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col gap-6">

        {/* Streak Banner */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
          />

          {/* Streak number + badge */}
          <div className="flex items-start justify-between mb-5 relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Current Streak
              </p>
              <p className="text-5xl font-bold leading-none tabular-nums">
                {streak}
                <span className="text-xl text-slate-500 font-normal ml-2">days</span>
              </p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full mt-1"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
            >
              {streakBadge}
            </span>
          </div>

          {/* Day circles */}
          <div className="flex flex-wrap gap-2 mb-3 relative z-10">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isRecorded = recordedDates.has(dateKey);
              const isToday    = dateKey === today;
              const entry      = entries.find((e) => e.date === dateKey);
              const moodInfo   = entry ? MOODS.find((m) => m.level === entry.mood) : null;

              return (
                <div
                  key={day}
                  title={entry ? `${day} — ${moodInfo?.label}` : `${day} — no entry`}
                  style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    border: isToday
                      ? '2px solid #6366f1'
                      : '1.5px solid rgba(255,255,255,0.12)',
                    background: isRecorded ? '#ffffff' : 'transparent',
                    boxShadow: isRecorded
                      ? isToday ? '0 0 0 3px rgba(99,102,241,0.35), 0 0 12px rgba(255,255,255,0.15)' : '0 0 8px rgba(255,255,255,0.12)'
                      : isToday ? '0 0 0 2px rgba(99,102,241,0.3)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: isRecorded ? '#060810' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.25s cubic-bezier(0.2,0.8,0.3,1)',
                    flexShrink: 0,
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-5 text-xs text-slate-500 relative z-10">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.18)' }} />
              No entry
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
              Recorded
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #6366f1' }} />
              Today
            </div>
          </div>
        </div>

        {/* Two-column: mood picker + monthly summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Mood of the Day */}
          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h2 className="font-semibold text-white mb-1">
              {alreadySaved ? 'Today\'s Mood' : 'Mood of the Day'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              {alreadySaved ? 'Recorded — tap to update.' : 'How are you feeling overall today?'}
            </p>

            {/* Mood buttons */}
            <div className="flex gap-2 mb-5">
              {MOODS.map((m) => {
                const isSelected = selectedMood === m.level;
                return (
                  <button
                    key={m.level}
                    onClick={() => setSelectedMood(m.level)}
                    className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 transition-all cursor-pointer"
                    style={{
                      border: isSelected ? `2px solid ${m.border}` : '1.5px solid rgba(255,255,255,0.07)',
                      background: isSelected ? m.bg : 'rgba(255,255,255,0.02)',
                      transform: isSelected ? 'translateY(-3px)' : 'none',
                      boxShadow: isSelected ? `0 8px 24px ${m.color}25` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{m.emoji}</span>
                    <span
                      style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: isSelected ? m.color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Optional note */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="One word, one sentence — whatever comes. Optional."
              className="w-full resize-none text-sm text-white placeholder-slate-600 focus:outline-none mb-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '10px 14px',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />

            <label className="flex items-start gap-3 mb-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={routineRemindersEnabled}
                onChange={(e) => setRoutineEnabled(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/40 focus:ring-offset-0 focus:ring-2 cursor-pointer shrink-0"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 leading-snug">
                Remind me for my daily check-in
              </span>
            </label>

            {routineRemindersEnabled && !routineBannerDismissed && (
              <div className="mb-4 relative rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                <button
                  type="button"
                  onClick={dismissRoutineBanner}
                  className="absolute top-2 right-2 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors text-lg leading-none"
                  aria-label="Dismiss"
                >
                  ×
                </button>
                <p className="text-xs font-semibold text-slate-300 pr-7 mb-1">
                  Your in-app routine
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Reminders stay on this screen: whenever you open Mood Tracker, the banner above nudges you until today is logged. No browser notifications.
                </p>
              </div>
            )}

            <button
              onClick={handleRecord}
              disabled={!selectedMood}
              className="w-full font-semibold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: saved ? '#10b981' : '#6366f1',
                color: '#fff',
                fontSize: 14,
              }}
            >
              {saved ? 'Recorded ✓' : alreadySaved ? 'Update Today' : 'Record Today →'}
            </button>
          </div>

          {/* Monthly Breakdown */}
          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h2 className="font-semibold text-white mb-1">This Month</h2>
            <p className="text-xs text-slate-500 mb-5">{monthName}</p>

            <div className="flex flex-col gap-3 flex-1">
              {[...moodCounts].reverse().map((m) => (
                <div key={m.level} className="flex items-center gap-3">
                  <span style={{ fontSize: 20, width: 26, textAlign: 'center', flexShrink: 0 }}>
                    {m.emoji}
                  </span>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">{m.label}</span>
                      <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
                        {m.count} {m.count === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4, borderRadius: 99,
                        background: 'rgba(255,255,255,0.05)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(m.count / maxCount) * 100}%`,
                          background: m.color,
                          borderRadius: 99,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Longest streak stat */}
            <div
              className="mt-5 flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-xs text-slate-500">Longest streak</span>
              <span className="text-sm font-bold tabular-nums text-white">{longestStreak} days</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
