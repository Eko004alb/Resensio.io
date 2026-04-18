import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 'done';

interface DiarioEntry {
  id: number;
  bodySensations: string[];
  contextTags: string[];
  contextNote: string;
  /** Legacy: word-list step removed; kept for older saved entries. */
  basicEmotion?: string;
  wheelPrimary?: string;
  wheelEmotion: string;
  created_at: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BODY_SENSATIONS = [
  'Tensione nel collo',
  'Nodo nello stomaco',
  'Respiro corto',
  'Battito accelerato',
  'Stanchezza diffusa',
  'Nessuna sensazione particolare',
];

const CONTEXT_TAGS = [
  'Lavoro',
  'Famiglia',
  'Relazione',
  'Tempo libero',
  'Niente di speciale',
];

interface PrimaryEmotion {
  label: string;
  color: string;
  colorDim: string;
  secondary: string[];
}

const EMOTION_WHEEL: Record<string, PrimaryEmotion> = {
  Rabbia: {
    label: 'Rabbia',
    color: '#c98780',
    colorDim: 'rgba(201,135,128,0.18)',
    secondary: ['Frustrazione', 'Risentimento', 'Irritazione', 'Ostilità', 'Fastidio', 'Impazienza'],
  },
  Tristezza: {
    label: 'Tristezza',
    color: '#8d98d3',
    colorDim: 'rgba(141,152,211,0.18)',
    secondary: ['Malinconia', 'Dolore', 'Delusione', 'Solitudine', 'Rimpianto', 'Vuoto'],
  },
  Paura: {
    label: 'Paura',
    color: '#a58bd5',
    colorDim: 'rgba(165,139,213,0.18)',
    secondary: ['Ansia', 'Preoccupazione', 'Insicurezza', 'Tensione', 'Timidezza', 'Apprensione'],
  },
  Gioia: {
    label: 'Gioia',
    color: '#d0b566',
    colorDim: 'rgba(208,181,102,0.18)',
    secondary: ['Serenità', 'Gratitudine', 'Entusiasmo', 'Orgoglio', 'Soddisfazione', 'Leggerezza'],
  },
  Sorpresa: {
    label: 'Sorpresa',
    color: '#66b5c0',
    colorDim: 'rgba(102,181,192,0.18)',
    secondary: ['Stupore', 'Meraviglia', 'Incredulità', 'Confusione', 'Curiosità', 'Shock'],
  },
  Tenerezza: {
    label: 'Tenerezza',
    color: '#c992b2',
    colorDim: 'rgba(201,146,178,0.18)',
    secondary: ['Affetto', 'Cura', 'Compassione', 'Connessione', 'Nostalgia', 'Dolcezza'],
  },
};

const PRIMARY_ORDER = Object.keys(EMOTION_WHEEL);

/** Fallback CTA accent when no wheel primary selected yet (matches previous indigo). */
const DEFAULT_STEP_ACCENT = '#6366f1';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace(/^#/, '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── SVG Helpers ──────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx: number, cy: number, rInner: number, rOuter: number, startDeg: number, endDeg: number) {
  const s1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const e1 = polarToCartesian(cx, cy, rOuter, endDeg);
  const s2 = polarToCartesian(cx, cy, rInner, endDeg);
  const e2 = polarToCartesian(cx, cy, rInner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

function midAngle(startDeg: number, endDeg: number) {
  return (startDeg + endDeg) / 2;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, accentColor = DEFAULT_STEP_ACCENT }: { current: WizardStep; accentColor?: string }) {
  if (current === 'done') return null;
  const total = 4;
  const stepIndex = current;
  return (
    <div className="w-full">
      <p className="text-xs text-slate-300/50 mb-2 tracking-wide">
        Step {stepIndex} of {total}
      </p>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={stepIndex}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const filled = n <= stepIndex;
          return (
            <div
              key={n}
              className="flex-1 h-1.5 rounded-full transition-colors duration-300"
              style={{ background: filled ? accentColor : 'rgba(255,255,255,0.1)' }}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="step-card-enter">
      <h2 className="text-2xl font-semibold text-white leading-snug mb-3">{title}</h2>
      {subtitle && <p className="text-sm font-light text-slate-300/70 leading-relaxed mb-7">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
    </div>
  );
}

function SelectChip({
  label,
  selected,
  onClick,
  color,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 text-left cursor-pointer hover:scale-[1.02]"
      style={
        selected
          ? {
              background: color ? `${color}28` : 'rgba(99,102,241,0.25)',
              border: `1px solid ${color ?? 'rgba(99,102,241,0.6)'}`,
              color: color ?? '#a5b4fc',
              boxShadow: `0 0 12px ${color ?? 'rgba(99,102,241,0.2)'}30`,
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
            }
      }
    >
      {label}
    </button>
  );
}

// ─── Emotion Wheel ────────────────────────────────────────────────────────────

function EmotionWheel({
  selectedPrimary,
  selectedEmotion,
  onSelectPrimary,
  onSelectEmotion,
}: {
  selectedPrimary: string;
  selectedEmotion: string;
  onSelectPrimary: (p: string) => void;
  onSelectEmotion: (e: string) => void;
}) {
  const cx = 200;
  const cy = 200;
  const rInner1 = 55;
  const rOuter1 = 104;
  /** Extra gap vs inner ring so primary/secondary labels do not overlap (was 124, gap 20). */
  const rInner2 = 136;
  const rOuter2 = 194;
  const n = PRIMARY_ORDER.length;
  const sliceDeg = 360 / n;

  const activePrimary = selectedPrimary ? EMOTION_WHEEL[selectedPrimary] : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 400 400"
        className="w-full"
        style={{ filter: 'drop-shadow(0 4px 32px rgba(0,0,0,0.4))' }}
      >
        {/* Centre circle */}
        <circle cx={cx} cy={cy} r={rInner1 - 2} fill="rgba(15,20,40,0.95)" />

        {/* Centre label */}
        <text
          x={cx}
          y={cy + 7}
          textAnchor="middle"
          fontSize="17"
          fill={activePrimary ? activePrimary.color : '#e2e8f0'}
          fontWeight="700"
          style={{ transition: 'fill 0.3s' }}
        >
          {activePrimary ? activePrimary.label : 'Scegli'}
        </text>

        {/* Inner ring — primary emotions */}
        {PRIMARY_ORDER.map((key, i) => {
          const startDeg = i * sliceDeg;
          const endDeg = startDeg + sliceDeg;
          const mid = midAngle(startDeg, endDeg);
          const isActive = selectedPrimary === key;
          const primary = EMOTION_WHEEL[key];
          const textPos = polarToCartesian(cx, cy, (rInner1 + rOuter1) / 2, mid);

          return (
            <g key={key} onClick={() => onSelectPrimary(key)} style={{ cursor: 'pointer' }}>
              <path
                d={sectorPath(cx, cy, rInner1, rOuter1, startDeg, endDeg - 1)}
                fill={isActive ? primary.color : primary.colorDim}
                stroke="rgba(15,20,40,0.8)"
                strokeWidth="1.5"
                style={{ transition: 'fill 0.25s' }}
              />
              <text
                x={textPos.x}
                y={textPos.y + 5}
                textAnchor="middle"
                fontSize="15"
                fill={isActive ? '#fff' : '#e2e8f0'}
                fontWeight={isActive ? '700' : '600'}
                style={{ pointerEvents: 'none', transition: 'fill 0.25s' }}
              >
                {key}
              </text>
            </g>
          );
        })}

        {/* Outer ring — secondary emotions (shown when primary selected) */}
        {activePrimary &&
          activePrimary.secondary.map((label, i) => {
            const startDeg = i * sliceDeg;
            const endDeg = startDeg + sliceDeg;
            const mid = midAngle(startDeg, endDeg);
            const isSelected = selectedEmotion === label;
            const textPos = polarToCartesian(cx, cy, (rInner2 + rOuter2) / 2, mid);

            return (
              <g
                key={label}
                onClick={() => onSelectEmotion(label)}
                className="wheel-outer-sector"
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={sectorPath(cx, cy, rInner2, rOuter2, startDeg, endDeg - 1)}
                  fill={
                    isSelected
                      ? activePrimary.color
                      : `${activePrimary.color}22`
                  }
                  stroke="rgba(15,20,40,0.7)"
                  strokeWidth="1.5"
                  style={{ transition: 'fill 0.2s' }}
                />
                <text
                  x={textPos.x}
                  y={textPos.y + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fill={isSelected ? '#fff' : '#cbd5e1'}
                  fontWeight={isSelected ? '700' : '500'}
                  style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                >
                  {label}
                </text>
              </g>
            );
          })}

        {/* Gap ring between inner and outer */}
        {activePrimary && (
          <circle
            cx={cx}
            cy={cy}
            r={(rInner2 + rOuter1) / 2}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={rInner2 - rOuter1}
          />
        )}
      </svg>

      {/* Selected emotion label */}
      {selectedEmotion && (
        <div
          className="mt-1 px-5 py-2 rounded-2xl text-sm font-semibold animate-chip-in"
          style={{
            background: activePrimary ? `${activePrimary.color}22` : 'rgba(99,102,241,0.2)',
            border: `1px solid ${activePrimary?.color ?? 'rgba(99,102,241,0.5)'}`,
            color: activePrimary?.color ?? '#a5b4fc',
          }}
        >
          ✓ {selectedEmotion}
        </div>
      )}
    </div>
  );
}

// ─── Completion Summary ───────────────────────────────────────────────────────

function CompletionSummary({
  entry,
  onReset,
}: {
  entry: DiarioEntry;
  onReset: () => void;
}) {
  const date = new Date(entry.created_at).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const timeline = [
    {
      icon: '🫁',
      label: 'Corpo',
      value: entry.bodySensations.length > 0 ? entry.bodySensations.join(', ') : 'Nessuna sensazione indicata',
    },
    {
      icon: '🗺️',
      label: 'Contesto',
      value:
        entry.contextTags.length > 0
          ? [entry.contextTags.join(', '), entry.contextNote].filter(Boolean).join(' — ')
          : entry.contextNote || 'Nessun contesto indicato',
    },
    {
      icon: '💬',
      label: 'Emozione principale',
      value: entry.wheelPrimary || entry.basicEmotion || 'Non specificata',
    },
    {
      icon: '🌀',
      label: 'Emozione affinata',
      value: entry.wheelEmotion || 'Non specificata',
    },
  ];

  return (
    <div className="step-card-enter flex flex-col gap-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🌱</div>
        <h2 className="text-2xl font-bold text-white mb-1">Registrato!</h2>
        <p className="text-sm text-slate-500">{date}</p>
      </div>

      <p className="text-sm text-slate-400 text-center leading-relaxed">
        Hai fatto qualcosa di prezioso: hai ascoltato te stesso. Ogni piccolo passo conta.
      </p>

      <div className="flex flex-col gap-0">
        {timeline.map((item, i) => (
          <div key={item.label} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                {item.icon}
              </div>
              {i < timeline.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
            <div className="pb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</p>
              <p className="text-sm text-slate-300 leading-relaxed">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={onReset}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] cursor-pointer"
          style={{ background: 'rgba(99,102,241,0.85)', border: '1px solid rgba(99,102,241,0.5)' }}
        >
          Scrivi un altro →
        </button>
        <Link
          to="/"
          className="w-full py-3 rounded-2xl text-sm font-medium text-slate-400 text-center transition-all hover:text-white cursor-pointer block"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Torna alla Home
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiarioEmotivoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as {
    restoreStep?: number;
    pendingEntry?: {
      bodySensations: string[];
      contextTags: string[];
      contextNote: string;
      wheelPrimary: string;
      wheelEmotion: string;
    };
    justSaved?: boolean;
    savedEmotion?: string;
  } | null;

  const [step, setStep] = useState<WizardStep>(() =>
    locationState?.restoreStep === 4 || locationState?.restoreStep === 3 ? 3 : 1
  );
  const [bodySensations, setBodySensations] = useState<string[]>(
    locationState?.pendingEntry?.bodySensations ?? []
  );
  const [contextTags, setContextTags] = useState<string[]>(
    locationState?.pendingEntry?.contextTags ?? []
  );
  const [contextNote, setContextNote] = useState(
    locationState?.pendingEntry?.contextNote ?? ''
  );
  const [wheelPrimary, setWheelPrimary] = useState(
    locationState?.pendingEntry?.wheelPrimary ?? ''
  );
  const [wheelEmotion, setWheelEmotion] = useState(
    locationState?.pendingEntry?.wheelEmotion ?? ''
  );
  const [savedEntry, setSavedEntry] = useState<DiarioEntry | null>(null);
  const [entriesCount, setEntriesCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // If returning from EmotionDetailPage after a confirmed save
  useEffect(() => {
    if (locationState?.justSaved) {
      const stored = localStorage.getItem('diario_emotivo_entries');
      const entries: DiarioEntry[] = stored ? JSON.parse(stored) : [];
      if (entries.length > 0) {
        setSavedEntry(entries[0]);
        setStep('done');
        setEntriesCount(entries.length);
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('diario_emotivo_entries');
    const entries: DiarioEntry[] = stored ? JSON.parse(stored) : [];
    setEntriesCount(entries.length);
  }, []);

  const scrollTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goNext = () => {
    setStep((s) => {
      if (s === 1) return 2;
      if (s === 2) return 3;
      return s;
    });
    scrollTop();
  };

  const goBack = () => {
    setStep((s) => {
      if (s === 2) return 1;
      if (s === 3) return 2;
      return s;
    });
    scrollTop();
  };

  const handleSave = () => {
    const entry: DiarioEntry = {
      id: Date.now(),
      bodySensations,
      contextTags,
      contextNote,
      wheelPrimary: wheelPrimary || undefined,
      wheelEmotion,
      created_at: new Date().toISOString(),
    };

    const stored = localStorage.getItem('diario_emotivo_entries');
    const entries: DiarioEntry[] = stored ? JSON.parse(stored) : [];
    const updated = [entry, ...entries];
    localStorage.setItem('diario_emotivo_entries', JSON.stringify(updated));
    setEntriesCount(updated.length);
    setSavedEntry(entry);
    setStep('done');
    scrollTop();
  };

  const handleReset = () => {
    setBodySensations([]);
    setContextTags([]);
    setContextNote('');
    setWheelPrimary('');
    setWheelEmotion('');
    setSavedEntry(null);
    setStep(1);
    scrollTop();
  };

  const toggleMulti = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const step3WheelAccent =
    wheelPrimary && EMOTION_WHEEL[wheelPrimary]
      ? EMOTION_WHEEL[wheelPrimary].color
      : DEFAULT_STEP_ACCENT;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div
        className="shrink-0 px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Home
        </Link>
        <h1 className="text-base font-semibold text-white tracking-tight">Diario Emotivo</h1>
        <span className="text-xs text-slate-600">{entriesCount > 0 ? `${entriesCount} voci` : ''}</span>
      </div>

      {/* Scrollable content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 py-8 flex flex-col gap-8">

          {/* Step indicator */}
          {step !== 'done' && (
            <StepIndicator current={step} accentColor={step === 3 ? step3WheelAccent : DEFAULT_STEP_ACCENT} />
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <StepCard
              title="Iniziamo dal tuo corpo. Cosa senti adesso?"
              subtitle="Spesso il corpo ci parla prima della mente. Seleziona quello che riconosci — anche se non sai perché."
            >
              <div className="flex-1 flex flex-col justify-between min-h-[58vh]">
                <div className="flex flex-col gap-3">
                  {BODY_SENSATIONS.map((s) => {
                    const selected = bodySensations.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleMulti(s, bodySensations, setBodySensations)}
                        className="w-full py-4 px-5 rounded-2xl text-sm font-medium transition-transform duration-150 active:scale-[0.98] text-left cursor-pointer"
                        style={
                          selected
                            ? {
                                background: 'rgba(99,102,241,0.25)',
                                border: '1px solid rgba(99,102,241,0.6)',
                                color: '#a5b4fc',
                              }
                            : {
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: '#cbd5e1',
                              }
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={goNext}
                  className="mt-auto w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.01] cursor-pointer"
                  style={{ background: 'rgba(99,102,241,0.85)', border: '1px solid rgba(99,102,241,0.5)' }}
                >
                  Avanti →
                </button>
              </div>
            </StepCard>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <StepCard
              title="C'è stato un momento specifico che ricordi di oggi?"
              subtitle="Anche un dettaglio piccolo va benissimo. Non serve un evento importante."
            >
              <div className="flex flex-wrap gap-2.5 mb-6">
                {CONTEXT_TAGS.map((t) => (
                  <SelectChip
                    key={t}
                    label={t}
                    selected={contextTags.includes(t)}
                    onClick={() => toggleMulti(t, contextTags, setContextTags)}
                  />
                ))}
              </div>

              <textarea
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                rows={3}
                placeholder="Descrivi brevemente, se vuoi… (opzionale)"
                maxLength={200}
                className="w-full text-sm text-white placeholder-slate-600 resize-none rounded-2xl px-4 py-3 focus:outline-none transition-colors leading-relaxed"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)')}
              />
              {contextNote.length > 0 && (
                <p className="text-xs text-slate-600 mt-1 text-right">{contextNote.length}/200</p>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={goBack}
                  className="px-5 py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-white transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  ← Indietro
                </button>
                <button
                  onClick={goNext}
                  className="px-7 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ background: 'rgba(99,102,241,0.85)', border: '1px solid rgba(99,102,241,0.5)' }}
                >
                  Avanti →
                </button>
              </div>
            </StepCard>
          )}

          {/* ── Step 3 — wheel ── */}
          {step === 3 && (
            <StepCard
              title="Esplora questa ruota per affinare ciò che provi."
              subtitle="Tocca un'emozione al centro, poi scegli quella più specifica nell'anello esterno. Nessuna scelta è sbagliata."
            >
              <EmotionWheel
                selectedPrimary={wheelPrimary}
                selectedEmotion={wheelEmotion}
                onSelectPrimary={(p) => {
                  setWheelPrimary(p);
                  setWheelEmotion('');
                }}
                onSelectEmotion={setWheelEmotion}
              />

              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={goBack}
                  className="px-5 py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-white transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  ← Indietro
                </button>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => {
                      const selectedEmotion = wheelEmotion || wheelPrimary;
                      if (selectedEmotion) {
                        navigate('/emotion-detail', {
                          state: {
                            emotion: selectedEmotion,
                            pendingEntry: {
                              bodySensations,
                              contextTags,
                              contextNote,
                              wheelPrimary,
                              wheelEmotion,
                            },
                            returnTo: '/diario',
                          },
                        });
                      } else {
                        handleSave();
                      }
                    }}
                    disabled={!wheelEmotion && !wheelPrimary}
                    className="px-7 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: hexToRgba(step3WheelAccent, 0.85),
                      border: `1px solid ${hexToRgba(step3WheelAccent, 0.5)}`,
                    }}
                  >
                    Continua →
                  </button>
                  {!wheelEmotion && !wheelPrimary && (
                    <button
                      onClick={handleSave}
                      className="text-xs text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      Salta e salva così →
                    </button>
                  )}
                </div>
              </div>
            </StepCard>
          )}

          {/* ── Done ── */}
          {step === 'done' && savedEntry && (
            <CompletionSummary entry={savedEntry} onReset={handleReset} />
          )}
        </div>
      </div>

      <style>{`
        .step-card-enter {
          animation: step-enter 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) both;
        }
        @keyframes step-enter {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .wheel-outer-sector {
          animation: outer-fade-in 0.3s ease-out both;
        }
        @keyframes outer-fade-in {
          from { opacity: 0; transform-origin: 200px 200px; transform: scale(0.88); }
          to   { opacity: 1; transform-origin: 200px 200px; transform: scale(1); }
        }

        .animate-chip-in {
          animation: chip-in 0.25s cubic-bezier(0.2, 0.8, 0.3, 1) both;
        }
        @keyframes chip-in {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
