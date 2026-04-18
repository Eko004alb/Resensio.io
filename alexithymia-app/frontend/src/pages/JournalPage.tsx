import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

function getMoodStreak(): number {
  try {
    const entries: { date: string }[] = JSON.parse(localStorage.getItem('mood_entries') || '[]');
    if (entries.length === 0) return 0;
    const dateSet = new Set(entries.map((e) => e.date));
    const toKey = (d: Date) => d.toISOString().slice(0, 10);
    const today = toKey(new Date());
    const startDay = dateSet.has(today) ? new Date() : (() => { const y = new Date(); y.setDate(y.getDate() - 1); return y; })();
    let streak = 0;
    const cursor = new Date(startDay);
    while (dateSet.has(toKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    return streak;
  } catch { return 0; }
}

interface JournalEntry {
  id: number;
  label: string;
  note: string;
  x_val: number;
  y_val: number;
  created_at: string;
}

interface DragState {
  x: number;
  y: number;
}

function emotionColor(x: number): string {
  // x: 0 = cool blue (unpleasant), 1 = warm red (pleasant)
  const stops = [
    { pos: 0,    r: 79,  g: 70,  b: 229 }, // indigo
    { pos: 0.25, r: 139, g: 92,  b: 246 }, // violet
    { pos: 0.5,  r: 168, g: 85,  b: 247 }, // purple
    { pos: 0.75, r: 251, g: 191, b: 36  }, // amber
    { pos: 1,    r: 239, g: 68,  b: 68  }, // red
  ];

  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (x >= stops[i].pos && x <= stops[i + 1].pos) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const t = upper.pos === lower.pos ? 0 : (x - lower.pos) / (upper.pos - lower.pos);
  const r = Math.round(lower.r + t * (upper.r - lower.r));
  const g = Math.round(lower.g + t * (upper.g - lower.g));
  const b = Math.round(lower.b + t * (upper.b - lower.b));
  return `rgb(${r},${g},${b})`;
}

function emotionSize(y: number, base = 14): number {
  return base + y * 36;
}

// ─── Feeling Explorer chatbot ────────────────────────────────────────────────

const EMOTION_WHEEL = {
  unpleasant_high: ['Overwhelmed', 'Agitated', 'Tense', 'Panicked', 'Irritable', 'Alarmed', 'Restless', 'Dread', 'Hostile'],
  unpleasant_low:  ['Melancholic', 'Despondent', 'Withdrawn', 'Apathetic', 'Hopeless', 'Numb', 'Gloomy', 'Drained', 'Disengaged'],
  pleasant_high:   ['Elated', 'Enthusiastic', 'Ecstatic', 'Energized', 'Inspired', 'Passionate', 'Thrilled', 'Exhilarated', 'Joyful'],
  pleasant_low:    ['Serene', 'Content', 'Tranquil', 'Grateful', 'Peaceful', 'Satisfied', 'Comfortable', 'Fulfilled', 'At ease'],
};

function getSuggestions(x: number, y: number, current: string): string[] {
  const key = `${x < 0.5 ? 'unpleasant' : 'pleasant'}_${y < 0.5 ? 'low' : 'high'}` as keyof typeof EMOTION_WHEEL;
  const pool = EMOTION_WHEEL[key].filter(e => e.toLowerCase() !== current.toLowerCase());
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
}

function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center text-xs shrink-0 mt-0.5">🧠</div>
      <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-slate-200 leading-relaxed max-w-[260px]"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end animate-fade-in">
      <div className="rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-indigo-100"
        style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.3)' }}>
        {children}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2 items-center animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center text-xs shrink-0">🧠</div>
      <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" style={{ animationDelay: '0.2s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [drag, setDrag] = useState<DragState>({ x: 0.5, y: 0.5 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSerenisModal, setShowSerenisModal] = useState(false);

  const [showBreathing, setShowBreathing] = useState(true);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);

  const [chatEntry, setChatEntry] = useState<JournalEntry | null>(null);
  const [chatStep, setChatStep] = useState<'intensity' | 'suggestions' | 'closing'>('intensity');
  const [chatIntensity, setChatIntensity] = useState<number | null>(null);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [chatTyping, setChatTyping] = useState(false);
  const [chatPickedSuggestion, setChatPickedSuggestion] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [showRelaxOverlay, setShowRelaxOverlay] = useState(false);
  const [relaxBreathPhase, setRelaxBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [relaxBreathCount, setRelaxBreathCount] = useState(0);
  const [showJoyOverlay, setShowJoyOverlay] = useState(false);
  const [joyEntryLabel, setJoyEntryLabel] = useState('');
  const [moodStreak, setMoodStreak] = useState(0);

  useEffect(() => {
    if (!showBreathing) return;
    let active = true;
    const pending: ReturnType<typeof setTimeout>[] = [];

    const runCycle = () => {
      if (!active) return;
      setBreathPhase('inhale');
      pending.push(setTimeout(() => {
        if (!active) return;
        setBreathPhase('hold');
        pending.push(setTimeout(() => {
          if (!active) return;
          setBreathPhase('exhale');
          pending.push(setTimeout(() => {
            if (!active) return;
            setBreathCount((c) => c + 1);
            runCycle();
          }, 4000));
        }, 2000));
      }, 4000));
    };

    runCycle();
    return () => { active = false; pending.forEach(clearTimeout); };
  }, [showBreathing]);

  useEffect(() => {
    if (!showRelaxOverlay) return;
    setRelaxBreathPhase('inhale');
    setRelaxBreathCount(0);
    let active = true;
    const pending: ReturnType<typeof setTimeout>[] = [];

    const runCycle = () => {
      if (!active) return;
      setRelaxBreathPhase('inhale');
      pending.push(setTimeout(() => {
        if (!active) return;
        setRelaxBreathPhase('hold');
        pending.push(setTimeout(() => {
          if (!active) return;
          setRelaxBreathPhase('exhale');
          pending.push(setTimeout(() => {
            if (!active) return;
            setRelaxBreathCount((c) => c + 1);
            runCycle();
          }, 4000));
        }, 2000));
      }, 4000));
    };

    runCycle();
    return () => { active = false; pending.forEach(clearTimeout); };
  }, [showRelaxOverlay]);

  const graphRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('journal_entries');
    setEntries(stored ? JSON.parse(stored) : []);
    setLoading(false);
    setMoodStreak(getMoodStreak());
  }, []);

  const updateDragFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = graphRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setDrag({ x, y });
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updateDragFromEvent(e.clientX, e.clientY);
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    updateDragFromEvent(e.clientX, e.clientY);
  }, [updateDragFromEvent]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    updateDragFromEvent(t.clientX, t.clientY);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatStep, chatTyping, chatIntensity]);

  const handleChatIntensity = (level: number) => {
    setChatIntensity(level);
    setChatTyping(true);
    setTimeout(() => {
      setChatTyping(false);
      setChatSuggestions(getSuggestions(chatEntry!.x_val, chatEntry!.y_val, chatEntry!.label));
      setChatStep('suggestions');
    }, 1200);
  };

  const handleChatSuggestion = (suggestion: string | null) => {
    setChatPickedSuggestion(suggestion);
    setChatTyping(true);
    setTimeout(() => {
      setChatTyping(false);
      setChatStep('closing');
    }, 1000);
  };

  const handleSave = async () => {
    if (!label.trim() || !note.trim()) {
      setSaveError('Please fill in both a label and a note.');
      return;
    }
    setSaving(true);
    setSaveError('');

    const optimisticEntry: JournalEntry = {
      id: Date.now(),
      label: label.trim(),
      note: note.trim(),
      x_val: drag.x,
      y_val: drag.y,
      created_at: new Date().toISOString(),
    };

    setEntries((prev) => {
      const next = [optimisticEntry, ...prev];
      const unpleasantCount = next.filter((e) => e.x_val < 0.5).length;
      if (unpleasantCount === 3) setShowSerenisModal(true);
      localStorage.setItem('journal_entries', JSON.stringify(next));
      return next;
    });

    // Show contextual overlay based on valence
    if (drag.x < 0.5) {
      setShowRelaxOverlay(true);
    } else {
      setJoyEntryLabel(optimisticEntry.label);
      setShowJoyOverlay(true);
    }

    setLabel('');
    setNote('');
    setDrag({ x: 0.5, y: 0.5 });
    setSaving(false);

    // Open the Feeling Explorer chatbot
    setChatEntry(optimisticEntry);
    setChatStep('intensity');
    setChatIntensity(null);
    setChatSuggestions([]);
    setChatTyping(false);
    setChatPickedSuggestion(null);

  };

  const handleDelete = (id: number) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem('journal_entries', JSON.stringify(next));
      return next;
    });
    if (selected?.id === id) setSelected(null);
  };

  const dotColor = emotionColor(drag.x);
  const dotSize = emotionSize(drag.y);

  // An "unpleasant" entry is anything placed on the left half of the X axis (x_val < 0.5)
  const hasUnpleasantEntry = entries.some((e) => e.x_val < 0.5);

  const now = new Date();
  const goodFeelingsThisMonth = entries.filter((e) => {
    const d = new Date(e.created_at);
    return e.x_val >= 0.5 && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Home
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">Feelings Journal</h1>
          {moodStreak > 0 && (
            <Link
              to="/mood"
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all hover:scale-105"
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#6ee7b7',
                fontSize: 11,
                fontWeight: 600,
                textDecoration: 'none',
              }}
              title="View Mood Tracker"
            >
              🚀 {moodStreak}d streak
            </Link>
          )}
        </div>
        <Link to="/test" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          Take Test
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Left Panel — Notes Input */}
        <div className="w-full lg:w-[380px] lg:shrink-0 border-r border-white/10 flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="font-semibold text-white mb-1">New Feeling Entry</h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Name what you feel, write about it, then place it on the graph.
            </p>

            {/* Label */}
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                Feeling Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Anxious, Calm, Angry…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            {/* Note */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                Your Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="Describe what you're feeling right now. What triggered it? Where do you feel it in your body?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Position preview */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4 mb-5">
              <div className="text-xs text-slate-500 mb-2">Current position on graph</div>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full shrink-0 transition-all duration-200"
                  style={{
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                    backgroundColor: dotColor,
                    boxShadow: `0 0 ${dotSize}px ${dotColor}60`,
                  }}
                />
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>X: {Math.round(drag.x * 100)}% — <span style={{ color: dotColor }}>color</span></div>
                  <div>Y: {Math.round(drag.y * 100)}% — size: {Math.round(dotSize)}px</div>
                </div>
              </div>
            </div>

            {saveError && (
              <p className="text-red-400 text-xs mb-3">{saveError}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save to Journal'}
            </button>

            {/* Serenis — always-visible subtle banner */}
            <a
              href="https://www.serenis.it/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center gap-3 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-indigo-500/30 rounded-xl px-4 py-3 transition-all group"
            >
              <span className="text-xl shrink-0">🧑‍⚕️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                  Talk to a psychologist
                </p>
                <p className="text-xs text-slate-500 leading-tight mt-0.5">
                  First consultation free · Serenis
                </p>
              </div>
              <span className="text-slate-600 group-hover:text-indigo-400 transition-colors text-sm">→</span>
            </a>

            {/* Serenis — prominent CTA after first unpleasant emotion is logged */}
            {hasUnpleasantEntry && (
              <div className="mt-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
                <p className="text-xs text-indigo-300 font-semibold mb-1">
                  You've logged an unpleasant emotion
                </p>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  It can help to talk to someone. Serenis connects you with a certified psychotherapist — your first session is completely free.
                </p>
                <a
                  href="https://www.serenis.it/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] text-sm cursor-pointer"
                >
                  <span>Book a Free Call with Serenis</span>
                  <span>↗</span>
                </a>
              </div>
            )}
          </div>

          {/* Entry List */}
          <div className="border-t border-white/10 p-4 max-h-64 lg:max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Past Entries ({entries.length})
              </h3>
              {goodFeelingsThisMonth > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-0.5">
                  ✨ {goodFeelingsThisMonth} good {goodFeelingsThisMonth === 1 ? 'feeling' : 'feelings'} this month
                </span>
              )}
            </div>
            {loading ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : entries.length === 0 ? (
              <p className="text-xs text-slate-500">No entries yet. Add one above!</p>
            ) : (
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    <div
                      className="rounded-full shrink-0"
                      style={{
                        width: `${Math.min(emotionSize(entry.y_val, 8), 24)}px`,
                        height: `${Math.min(emotionSize(entry.y_val, 8), 24)}px`,
                        backgroundColor: emotionColor(entry.x_val),
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{entry.label}</div>
                      <div className="text-xs text-slate-500 truncate">{entry.note}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      className="text-slate-600 hover:text-red-400 transition-colors text-xs opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Panel — XY Graph */}
        <div className="flex-1 flex flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white mb-1">Emotion Map</h2>
              <p className="text-xs text-slate-500">
                Drag the dot · <span className="text-slate-400">X axis = color</span> · <span className="text-slate-400">Y axis = size</span>
              </p>
            </div>
            <div className="text-xs text-slate-600 text-right hidden sm:block">
              Based on Russell's Circumplex Model of Affect
            </div>
          </div>

          {/* Graph Container */}
          <div className="relative flex-1 min-h-[400px]">
            {/* Axis Labels */}
            <div className="absolute inset-0 pointer-events-none select-none z-10">
              {/* Y-axis labels */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">
                High Intensity
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">
                Low Intensity
              </div>
              {/* X-axis labels */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-indigo-400 font-medium rotate-180" style={{ writingMode: 'vertical-lr' }}>
                Unpleasant
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400 font-medium" style={{ writingMode: 'vertical-lr' }}>
                Pleasant
              </div>
            </div>

            {/* Graph Area */}
            <div
              ref={graphRef}
              onMouseDown={onMouseDown}
              onTouchStart={(e) => {
                const t = e.touches[0];
                updateDragFromEvent(t.clientX, t.clientY);
              }}
              onTouchMove={onTouchMove}
              className="absolute inset-0 mx-8 mb-6 mt-6 rounded-2xl cursor-crosshair overflow-hidden"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, rgba(15,15,35,0.8) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="0.5" strokeDasharray="4,4" />
              </svg>

              {/* Saved entry dots */}
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="absolute transform -translate-x-1/2 translate-y-1/2 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    left: `${entry.x_val * 100}%`,
                    bottom: `${entry.y_val * 100}%`,
                  }}
                  title={entry.label}
                >
                  <div
                    className="rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      width: `${emotionSize(entry.y_val)}px`,
                      height: `${emotionSize(entry.y_val)}px`,
                      backgroundColor: emotionColor(entry.x_val),
                      boxShadow: `0 0 ${emotionSize(entry.y_val) * 0.6}px ${emotionColor(entry.x_val)}50`,
                      fontSize: `${Math.max(8, emotionSize(entry.y_val) * 0.28)}px`,
                    }}
                  >
                    {entry.label.charAt(0).toUpperCase()}
                  </div>
                </button>
              ))}

              {/* Active drag dot */}
              <div
                className="absolute transform -translate-x-1/2 translate-y-1/2 pointer-events-none"
                style={{
                  left: `${drag.x * 100}%`,
                  bottom: `${drag.y * 100}%`,
                  transition: isDragging.current ? 'none' : 'all 0.3s ease',
                }}
              >
                <div
                  className="rounded-full ring-2 ring-white/50 ring-offset-2 ring-offset-transparent"
                  style={{
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                    backgroundColor: dotColor,
                    boxShadow: `0 0 ${dotSize * 1.2}px ${dotColor}70`,
                    transition: isDragging.current ? 'none' : 'all 0.2s ease',
                  }}
                />
              </div>

              {/* Instruction overlay when no entries */}
              {entries.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-slate-600 text-sm text-center px-10">
                    Drag the dot to place your feelings.<br />Save an entry to see it appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feeling Explorer Chatbot */}
      {chatEntry && (
        <div
          className="fixed bottom-6 right-6 z-40 flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
          style={{
            width: '340px',
            maxHeight: '500px',
            background: 'rgba(10, 15, 30, 0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(99,102,241,0.08)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500/25 border border-indigo-500/40 flex items-center justify-center text-sm">🧠</div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">Feeling Explorer</p>
                <p className="text-xs text-indigo-400 leading-tight">Let's go deeper</p>
              </div>
            </div>
            <button
              onClick={() => setChatEntry(null)}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            <BotBubble>
              You just recorded <strong className="text-white">"{chatEntry.label}"</strong>.
            </BotBubble>
            <BotBubble>
              On a scale of 1 to 10, how intensely are you feeling this right now?
            </BotBubble>

            {/* Intensity picker */}
            {!chatIntensity && chatStep === 'intensity' && (
              <div className="flex gap-1.5 flex-wrap pl-8 animate-fade-in">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleChatIntensity(n)}
                    className="w-8 h-8 rounded-xl text-sm font-semibold transition-all hover:scale-110 cursor-pointer"
                    style={{
                      background: n <= 3 ? 'rgba(99,102,241,0.2)' : n <= 6 ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)',
                      border: n <= 3 ? '1px solid rgba(99,102,241,0.4)' : n <= 6 ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(239,68,68,0.4)',
                      color: n <= 3 ? '#a5b4fc' : n <= 6 ? '#d8b4fe' : '#fca5a5',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {/* User response: intensity */}
            {chatIntensity !== null && (
              <UserBubble>{chatIntensity} / 10</UserBubble>
            )}

            {/* Typing indicator */}
            {chatTyping && <TypingBubble />}

            {/* Suggestions step */}
            {chatStep === 'suggestions' && !chatTyping && (
              <>
                <BotBubble>
                  {chatIntensity! >= 7
                    ? `A ${chatIntensity} — that's quite intense.`
                    : chatIntensity! >= 4
                    ? `A ${chatIntensity} — noticeable and real.`
                    : `A ${chatIntensity} — mild but worth noticing.`}
                  {' '}Here are 3 feelings that might describe your experience more precisely:
                </BotBubble>
                <div className="flex gap-2 flex-wrap pl-8 animate-fade-in">
                  {chatSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleChatSuggestion(s)}
                      className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105 cursor-pointer"
                      style={{
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.35)',
                        color: '#c7d2fe',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleChatSuggestion(null)}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors cursor-pointer pl-8 animate-fade-in"
                >
                  None of these feel right →
                </button>
              </>
            )}

            {/* User picked suggestion */}
            {chatPickedSuggestion && (
              <UserBubble>{chatPickedSuggestion}</UserBubble>
            )}

            {/* Closing step */}
            {chatStep === 'closing' && !chatTyping && (
              <>
                <BotBubble>
                  {chatEntry.x_val >= 0.5
                    ? <>Wonderful. Recognizing <strong className="text-white">"{chatPickedSuggestion || chatEntry.label}"</strong> shows real self-awareness. Sit with this feeling — you deserve to enjoy it fully.</>
                    : <>Thank you for exploring this with me. Naming <strong className="text-white">"{chatPickedSuggestion || chatEntry.label}"</strong> with this clarity is already a meaningful step toward understanding yourself. You're doing great.</>
                  }
                </BotBubble>
                <div className="pl-8 animate-fade-in">
                  <button
                    onClick={() => setChatEntry(null)}
                    className="w-full py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Close ×
                  </button>
                </div>
              </>
            )}

            <div ref={chatBottomRef} />
          </div>
        </div>
      )}

      {/* Serenis Modal — triggers on 3rd unpleasant entry */}
      {showSerenisModal && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSerenisModal(false)}
        >
          <div
            className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-indigo-900/50 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">💙</div>
            <h2 className="text-xl font-bold text-white mb-2">
              You've been carrying a lot...
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              You've logged{' '}
              <strong className="text-indigo-300">3 unpleasant emotions</strong>.
              Speaking with a certified psychotherapist can make a real difference.
              Your <strong className="text-white">first session is completely free</strong>.
            </p>
            <a
              href="https://www.serenis.it/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all hover:scale-105 text-sm mb-3"
            >
              Book My Free Session on Serenis ↗
            </a>
            <button
              onClick={() => setShowSerenisModal(false)}
              className="w-full text-slate-500 hover:text-slate-300 py-2 text-sm transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Entry Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-slate-900 border border-white/15 rounded-3xl p-7 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="rounded-full shrink-0"
                style={{
                  width: `${Math.min(emotionSize(selected.y_val), 40)}px`,
                  height: `${Math.min(emotionSize(selected.y_val), 40)}px`,
                  backgroundColor: emotionColor(selected.x_val),
                  boxShadow: `0 0 20px ${emotionColor(selected.x_val)}50`,
                }}
              />
              <div>
                <h3 className="font-bold text-white text-lg">{selected.label}</h3>
                <p className="text-xs text-slate-500">
                  {new Date(selected.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">{selected.note}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-white/10 text-slate-300 hover:text-white py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breathing Overlay */}
      {showBreathing && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Animated breathing circle */}
          <div
            key={breathPhase}
            className="absolute rounded-full breathing-circle"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(99,102,241,0.4) 50%, rgba(99,92,246,0.1) 75%, transparent 100%)',
              boxShadow: '0 0 80px 20px rgba(139,92,246,0.2)',
              animationName: `circle-${breathPhase}`,
              animationDuration: breathPhase === 'hold' ? '2s' : '4s',
              animationTimingFunction: breathPhase === 'inhale' ? 'ease-in' : breathPhase === 'hold' ? 'linear' : 'ease-out',
              animationFillMode: 'both',
              animationIterationCount: 1,
            }}
          />

          {/* Text and button — layered above circle */}
          <div className="relative z-10 flex flex-col items-center select-none" style={{ gap: '1.5rem' }}>
            <p className="text-slate-400 text-sm uppercase tracking-[0.25em] font-medium">
              Breathe
            </p>

            {/* Wrapper drives font-size animation; remounts with key so animation restarts each phase */}
            <div
              key={breathPhase}
              className="breath-label font-bold text-white tracking-wider"
              style={{
                animationName: `text-${breathPhase}`,
                animationDuration: breathPhase === 'hold' ? '2s' : '4s',
                animationTimingFunction: breathPhase === 'inhale' ? 'ease-in' : breathPhase === 'hold' ? 'linear' : 'ease-out',
                animationFillMode: 'both',
                animationIterationCount: 1,
              }}
            >
              <p key={breathPhase} style={{ margin: 0 }}>
                {(breathPhase === 'inhale' ? 'Inhale' : breathPhase === 'hold' ? 'Hold' : 'Exhale')
                  .split('').map((char, i) => (
                    <span key={i} className={`pixel-letter pixel-letter-${(i % 6) + 1}`}>
                      {char}
                    </span>
                  ))}
              </p>
            </div>

            {breathCount >= 1 && (
              <button
                onClick={() => setShowBreathing(false)}
                className="mt-4 px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-2xl transition-all hover:scale-105 text-sm animate-fade-in cursor-pointer"
              >
                Continue to Journal →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Relax Overlay — triggered after saving an unpleasant feeling */}
      {showRelaxOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center overflow-hidden">
          {/* Soothing animated circle */}
          <div
            key={relaxBreathPhase}
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(79,70,229,0.2) 50%, transparent 75%)',
              boxShadow: '0 0 100px 30px rgba(99,102,241,0.12)',
              animationName: `circle-${relaxBreathPhase}`,
              animationDuration: relaxBreathPhase === 'hold' ? '2s' : '4s',
              animationTimingFunction: relaxBreathPhase === 'inhale' ? 'ease-in' : relaxBreathPhase === 'hold' ? 'linear' : 'ease-out',
              animationFillMode: 'both',
              animationIterationCount: 1,
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm" style={{ gap: '1rem' }}>
            <p className="text-slate-400 text-xs uppercase tracking-[0.3em] font-medium">
              Let's slow down together
            </p>

            <div
              key={relaxBreathPhase}
              className="breath-label font-bold text-white tracking-wider"
              style={{
                animationName: `text-${relaxBreathPhase}`,
                animationDuration: relaxBreathPhase === 'hold' ? '2s' : '4s',
                animationTimingFunction: relaxBreathPhase === 'inhale' ? 'ease-in' : relaxBreathPhase === 'hold' ? 'linear' : 'ease-out',
                animationFillMode: 'both',
                animationIterationCount: 1,
              }}
            >
              <p key={relaxBreathPhase} style={{ margin: 0 }}>
                {(relaxBreathPhase === 'inhale' ? 'Inhale' : relaxBreathPhase === 'hold' ? 'Hold' : 'Exhale')
                  .split('').map((char, i) => (
                    <span key={i} className={`pixel-letter pixel-letter-${(i % 6) + 1}`}>
                      {char}
                    </span>
                  ))}
              </p>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              It's okay to feel this way. Take a moment to breathe — your feelings are valid and you're not alone.
            </p>

            <div className="grid grid-cols-1 gap-2 w-full mt-2">
              {[
                { icon: '🌊', tip: 'Notice the rise and fall of your breath' },
                { icon: '🤲', tip: 'Relax your shoulders and unclench your jaw' },
                { icon: '🌿', tip: 'This moment will pass — you are safe' },
              ].map(({ icon, tip }) => (
                <div key={tip} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-left">
                  <span className="text-lg shrink-0">{icon}</span>
                  <p className="text-xs text-slate-400 leading-snug">{tip}</p>
                </div>
              ))}
            </div>

            {relaxBreathCount >= 1 && (
              <button
                onClick={() => { setShowRelaxOverlay(false); setRelaxBreathCount(0); }}
                className="mt-2 px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-2xl transition-all hover:scale-105 text-sm animate-fade-in cursor-pointer"
              >
                I feel a little better →
              </button>
            )}
            {relaxBreathCount === 0 && (
              <button
                onClick={() => { setShowRelaxOverlay(false); setRelaxBreathCount(0); }}
                className="mt-1 text-slate-600 hover:text-slate-400 text-xs transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Joy Overlay — triggered after saving a pleasant feeling */}
      {showJoyOverlay && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowJoyOverlay(false)}
        >
          <div
            className="bg-slate-900 border border-amber-400/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-amber-900/30 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing star burst */}
            <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)',
                  animation: 'joy-pulse 2s ease-in-out infinite',
                }}
              />
              <span className="text-5xl relative z-10">✨</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              You felt <span className="text-amber-300">{joyEntryLabel || 'something good'}</span>!
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Noticing and naming good feelings strengthens them. Savour this moment — let it sink in.
            </p>

            {/* Monthly good feelings counter */}
            <div className="bg-amber-400/10 border border-amber-400/25 rounded-2xl px-5 py-4 mb-6">
              <p className="text-3xl font-bold text-amber-300 mb-0.5">
                {goodFeelingsThisMonth}
              </p>
              <p className="text-xs text-slate-400">
                positive {goodFeelingsThisMonth === 1 ? 'feeling' : 'feelings'} recorded in{' '}
                {now.toLocaleString('default', { month: 'long' })}
              </p>
              {goodFeelingsThisMonth >= 5 && (
                <p className="text-xs text-amber-300 font-medium mt-1.5">
                  You're on a roll this month 🎉
                </p>
              )}
            </div>

            <div className="space-y-2">
              {[
                { icon: '🌅', tip: 'Pause and smile — your brain will remember this' },
                { icon: '💛', tip: 'Share this feeling with someone you care about' },
                { icon: '🎯', tip: 'Do one small thing that keeps this energy going' },
              ].map(({ icon, tip }) => (
                <div key={tip} className="flex items-center gap-3 bg-white/4 rounded-xl px-4 py-2.5 text-left">
                  <span className="text-base shrink-0">{icon}</span>
                  <p className="text-xs text-slate-400 leading-snug">{tip}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowJoyOverlay(false)}
              className="mt-6 w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3.5 rounded-xl transition-all hover:scale-105 text-sm cursor-pointer"
            >
              Enjoy the rest of my day →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.35s cubic-bezier(0.2, 0.8, 0.3, 1); }

        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30%           { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot { animation: typing-bounce 1.2s ease-in-out infinite; }

        /* Phase-driven circle animations — each remounts with key={phase} */
        @keyframes circle-inhale {
          from { width: 18vmin; height: 18vmin; }
          to   { width: 72vmin; height: 72vmin; }
        }
        @keyframes circle-hold {
          from { width: 72vmin; height: 72vmin; }
          to   { width: 72vmin; height: 72vmin; }
        }
        @keyframes circle-exhale {
          from { width: 72vmin; height: 72vmin; }
          to   { width: 18vmin; height: 18vmin; }
        }

        /* Phase-driven font-size animations */
        @keyframes text-inhale {
          from { font-size: 1.4rem; }
          to   { font-size: 3.6rem; }
        }
        @keyframes text-hold {
          from { font-size: 3.6rem; }
          to   { font-size: 3.6rem; }
        }
        @keyframes text-exhale {
          from { font-size: 3.6rem; }
          to   { font-size: 1.4rem; }
        }
        .breath-label {
          display: inline-block;
        }

        /* Per-letter pixel entrance — each flies in from a unique direction */
        .pixel-letter {
          display: inline-block;
          opacity: 0;
          animation-duration: 0.45s;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.3, 1);
        }
        @keyframes px1 { from { opacity:0; transform: translate(-18px,-28px) scale(0.08); filter:blur(7px); } to { opacity:1; transform:translate(0,0) scale(1); filter:blur(0); } }
        @keyframes px2 { from { opacity:0; transform: translate( 22px,-20px) scale(0.08); filter:blur(7px); } to { opacity:1; transform:translate(0,0) scale(1); filter:blur(0); } }
        @keyframes px3 { from { opacity:0; transform: translate(-10px, 30px) scale(0.08); filter:blur(7px); } to { opacity:1; transform:translate(0,0) scale(1); filter:blur(0); } }
        @keyframes px4 { from { opacity:0; transform: translate( 28px, 18px) scale(0.08); filter:blur(7px); } to { opacity:1; transform:translate(0,0) scale(1); filter:blur(0); } }
        @keyframes px5 { from { opacity:0; transform: translate(-24px, 10px) scale(0.08); filter:blur(7px); } to { opacity:1; transform:translate(0,0) scale(1); filter:blur(0); } }
        @keyframes px6 { from { opacity:0; transform: translate( 14px,-32px) scale(0.08); filter:blur(7px); } to { opacity:1; transform:translate(0,0) scale(1); filter:blur(0); } }
        .pixel-letter-1 { animation-name: px1; animation-delay: 0.00s; }
        .pixel-letter-2 { animation-name: px2; animation-delay: 0.07s; }
        .pixel-letter-3 { animation-name: px3; animation-delay: 0.14s; }
        .pixel-letter-4 { animation-name: px4; animation-delay: 0.21s; }
        .pixel-letter-5 { animation-name: px5; animation-delay: 0.28s; }
        .pixel-letter-6 { animation-name: px6; animation-delay: 0.35s; }

        @keyframes phase-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes joy-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.35); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
