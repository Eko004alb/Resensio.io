import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PAQ_QUESTIONS,
  PAQ_SUBSCALE_INFO,
  PAQ_LIKERT_LABELS,
  PAQ_SUBSCALE_MAX,
  type PAQSubscale,
} from '../data/paq-questions';

const SUBSCALE_ORDER: PAQSubscale[] = ['ndif', 'pdif', 'nddf', 'pddf', 'eot'];

export default function PAQTestPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const setAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = PAQ_QUESTIONS.length;
  const progressPct = Math.round((answeredCount / totalCount) * 100);
  const allAnswered = answeredCount === totalCount;

  const calculateScore = () => {
    let total = 0;
    const subscores: Record<PAQSubscale, number> = { ndif: 0, pdif: 0, nddf: 0, pddf: 0, eot: 0 };

    for (const q of PAQ_QUESTIONS) {
      const raw = answers[q.id] ?? 0;
      const scored = q.reversed ? 6 - raw : raw;
      total += scored;
      subscores[q.subscale] += scored;
    }

    return { total, subscores };
  };

  const handleSubmit = () => {
    if (!allAnswered) return;

    const { total, subscores } = calculateScore();

    localStorage.setItem('paq_results', JSON.stringify({ score: total, subscores, takenAt: Date.now() }));

    navigate('/paq-results', { state: { score: total, subscores } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/results" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back
          </Link>
          <div className="flex-1 mx-8">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progress</span>
              <span>{answeredCount} / {totalCount}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-slate-400 w-14 text-right">{progressPct}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Perth Alexithymia Questionnaire</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).
            There are no right or wrong answers — answer honestly based on how you generally feel.
          </p>
          <div className="mt-3 text-xs text-slate-500 italic">
            Preece et al. (2018) — validated in the <em>Journal of Affective Disorders</em>
          </div>

          {/* Time estimate banner */}
          <div className="mt-5 flex items-start gap-3 bg-teal-500/10 border border-teal-500/25 rounded-2xl px-5 py-4">
            <span className="text-teal-400 text-lg shrink-0">⏱</span>
            <div>
              <p className="text-teal-300 text-sm font-medium">
                Approximately <strong>10 minutes</strong> to complete
              </p>
              <p className="text-teal-400/70 text-xs mt-0.5 leading-relaxed">
                This questionnaire goes deeper than the TAS-20 by assessing alexithymia separately
                across positive and negative emotional contexts — giving you a more precise picture.
              </p>
            </div>
          </div>
        </div>

        {SUBSCALE_ORDER.map((subscale) => {
          const info = PAQ_SUBSCALE_INFO[subscale];
          const sectionQuestions = PAQ_QUESTIONS.filter((q) => q.subscale === subscale);
          const sectionAnswered = sectionQuestions.filter((q) => answers[q.id]).length;

          const colorMap: Record<string, string> = {
            indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
            teal:   'text-teal-400 bg-teal-500/10 border-teal-500/30',
            violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
            purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
            rose:   'text-rose-400 bg-rose-500/10 border-rose-500/30',
          };
          const dotMap: Record<string, string> = {
            indigo: 'bg-indigo-500',
            teal:   'bg-teal-500',
            violet: 'bg-violet-500',
            purple: 'bg-purple-500',
            rose:   'bg-rose-500',
          };

          return (
            <section key={subscale} className="mb-10">
              <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-medium mb-5 ${colorMap[info.color]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotMap[info.color]}`} />
                {info.label} — {sectionAnswered}/{sectionQuestions.length}
              </div>

              <div className="flex flex-col gap-4">
                {sectionQuestions.map((q) => (
                  <PAQQuestionCard
                    key={q.id}
                    number={q.id}
                    text={q.text}
                    value={answers[q.id]}
                    onChange={(v) => setAnswer(q.id, v)}
                    accentColor={info.color}
                    maxPerSubscale={PAQ_SUBSCALE_MAX[q.subscale]}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Submit */}
        <div className="pt-4 pb-16">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-teal-500 hover:bg-teal-400 hover:scale-[1.01] shadow-lg shadow-teal-500/20"
          >
            See My PAQ Results
          </button>
          {!allAnswered && (
            <p className="text-center text-sm text-slate-500 mt-3">
              {totalCount - answeredCount} question{totalCount - answeredCount !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface PAQQuestionCardProps {
  number: number;
  text: string;
  value?: number;
  onChange: (v: number) => void;
  accentColor: string;
  maxPerSubscale: number;
}

function PAQQuestionCard({ number, text, value, onChange, accentColor }: PAQQuestionCardProps) {
  const selectedMap: Record<string, string> = {
    indigo: 'bg-indigo-500 text-white border-indigo-500',
    teal:   'bg-teal-500 text-white border-teal-500',
    violet: 'bg-violet-500 text-white border-violet-500',
    purple: 'bg-purple-500 text-white border-purple-500',
    rose:   'bg-rose-500 text-white border-rose-500',
  };

  return (
    <div className={`bg-white/5 border rounded-2xl p-5 transition-colors ${value ? 'border-white/20' : 'border-white/8'}`}>
      <div className="flex gap-3 mb-4">
        <span className="text-slate-500 text-sm font-mono w-6 shrink-0 pt-0.5">{number}.</span>
        <p className="text-slate-200 leading-relaxed text-sm">{text}</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`
              flex flex-col items-center gap-1 border rounded-xl py-2 px-1 text-xs transition-all cursor-pointer
              ${value === v ? selectedMap[accentColor] : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}
            `}
          >
            <span className="font-semibold text-sm">{v}</span>
            <span className="text-center leading-tight hidden sm:block" style={{ fontSize: '0.6rem' }}>
              {PAQ_LIKERT_LABELS[v - 1]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
