import { useLocation, useNavigate } from 'react-router-dom';
import { getEmotionDetail } from '../data/emotionDetails';

interface PendingDiarioEntry {
  bodySensations: string[];
  contextTags: string[];
  contextNote: string;
  wheelPrimary: string;
  wheelEmotion: string;
}

interface LocationState {
  emotion: string;
  pendingEntry?: PendingDiarioEntry;
  returnTo?: string;
}

/** Turns ALL-CAPS emotion labels into normal title case (e.g. FRUSTRAZIONE → Frustrazione). */
function emotionTitleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-black/10 rounded-2xl p-5">
      <h2 className="text-xl font-black uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </div>
  );
}

function ArrowListItem({ text }: { text: string }) {
  return (
    <li className="flex gap-2 items-start text-base leading-relaxed font-light" style={{ opacity: 0.9 }}>
      <span className="shrink-0 select-none" aria-hidden>
        →
      </span>
      <span className="min-w-0 flex-1">{text}</span>
    </li>
  );
}

export default function EmotionDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const emotionName = state?.emotion ?? '';
  const detail = getEmotionDetail(emotionName);
  const pendingEntry = state?.pendingEntry;
  const returnTo = state?.returnTo ?? '/diario';

  if (!detail) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-4 px-6">
        <p className="text-slate-400 text-center">Emozione non trovata.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 bg-slate-800 text-white font-medium py-3 px-6 rounded-2xl"
        >
          ← Torna indietro
        </button>
      </div>
    );
  }

  const displayName = emotionTitleCase(detail.name);

  const handleConfirm = () => {
    if (pendingEntry) {
      const entry = {
        id: Date.now(),
        bodySensations: pendingEntry.bodySensations,
        contextTags: pendingEntry.contextTags,
        contextNote: pendingEntry.contextNote,
        wheelPrimary: pendingEntry.wheelPrimary || undefined,
        wheelEmotion: pendingEntry.wheelEmotion || pendingEntry.wheelPrimary,
        created_at: new Date().toISOString(),
      };
      const stored = localStorage.getItem('diario_emotivo_entries');
      const entries = stored ? JSON.parse(stored) : [];
      localStorage.setItem('diario_emotivo_entries', JSON.stringify([entry, ...entries]));
    }
    navigate(returnTo, { state: { justSaved: true, savedEmotion: emotionName } });
  };

  const handleLookForAnother = () => {
    navigate(returnTo, {
      state: {
        restoreStep: 3,
        pendingEntry,
      },
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: detail.bgColor, color: detail.textColor }}
    >
      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-5 pt-10 max-w-lg mx-auto w-full space-y-3"
        style={{
          paddingBottom: 'max(160px, calc(120px + env(safe-area-inset-bottom, 0px)))',
        }}
      >
        {/* Category badge + title */}
        <div className="flex flex-col items-center text-center">
          {detail.primary ? (
            <span
              className="inline-block font-black text-sm uppercase tracking-widest px-4 py-2 rounded-xl"
              style={{
                backgroundColor: detail.textColor,
                color: detail.bgColor,
              }}
            >
              {detail.primary}
            </span>
          ) : null}
          <h1
            className={`text-4xl sm:text-5xl font-black tracking-tight normal-case ${detail.primary ? 'mt-4' : ''}`}
          >
            {displayName}
          </h1>
        </div>

        {/* Definition */}
        <Section title="Definizione">
          <p className="text-base leading-relaxed font-light" style={{ opacity: 0.9 }}>
            {detail.definition}
          </p>
        </Section>

        {/* Situations */}
        <Section title="Situazioni">
          <ul className="space-y-2 list-none">
            {detail.situations.map((s, i) => (
              <ArrowListItem key={i} text={s} />
            ))}
          </ul>
        </Section>

        {/* Symptoms */}
        <Section title="Sintomi">
          <ul className="space-y-2 list-none">
            {detail.symptoms.map((s, i) => (
              <ArrowListItem key={i} text={s} />
            ))}
          </ul>
        </Section>

        {/* Function */}
        <Section title="Funzione">
          <p className="text-base leading-relaxed font-light" style={{ opacity: 0.9 }}>
            {detail.function}
          </p>
        </Section>
      </div>

      {/* Sticky bottom buttons */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 flex flex-col"
        style={{
          background: `linear-gradient(to bottom, ${detail.bgColor}00 0%, ${detail.bgColor} 40%)`,
        }}
      >
        <button
          onClick={handleConfirm}
          className="w-full max-w-lg mx-auto py-4 rounded-full font-bold text-base tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            backgroundColor: detail.textColor,
            color: detail.bgColor,
          }}
        >
          {pendingEntry ? 'Sì, sento questo' : 'Ho capito questa emozione'}
        </button>

        <button
          onClick={handleLookForAnother}
          className="w-full max-w-lg mx-auto mt-3 py-3 rounded-full font-semibold text-sm tracking-wide transition-all cursor-pointer border-2 border-black/40 bg-transparent"
          style={{ color: detail.textColor }}
        >
          Cerca un'altra emozione
        </button>
      </div>
    </div>
  );
}
