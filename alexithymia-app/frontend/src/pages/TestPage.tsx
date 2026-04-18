import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QUESTIONS, LIKERT_LABELS, type Subscale } from '../data/questions';

type Phase = 'intro' | 'question' | 'summary';

export default function TestPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const totalQuestions = QUESTIONS.length;
  const currentQuestion = QUESTIONS[currentIndex];
  const progressPct = Math.round((Object.keys(answers).length / totalQuestions) * 100);

  useEffect(() => {
    if (phase === 'question') {
      setSelectedValue(answers[currentQuestion?.id] ?? null);
    }
  }, [currentIndex, phase, answers, currentQuestion?.id]);

  const handleSelect = (value: number) => {
    if (animating) return;
    setSelectedValue(value);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setPhase('summary');
      }
    }, 380);
  };

  const handleBack = () => {
    if (phase === 'summary') {
      setPhase('question');
      setCurrentIndex(totalQuestions - 1);
      return;
    }
    if (currentIndex === 0) {
      setPhase('intro');
    } else {
      setCurrentIndex((i) => i - 1);
    }
  };

  const calculateScore = () => {
    let total = 0;
    const subscores: Record<Subscale, number> = { dif: 0, ddf: 0, eot: 0 };
    for (const q of QUESTIONS) {
      const raw = answers[q.id] ?? 0;
      const scored = q.reversed ? 6 - raw : raw;
      total += scored;
      subscores[q.subscale] += scored;
    }
    return { total, subscores };
  };

  const handleSubmit = () => {
    const { total, subscores } = calculateScore();
    localStorage.setItem('tas_results', JSON.stringify({ score: total, subscores, takenAt: Date.now() }));
    navigate('/results', { state: { score: total, subscores } });
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col">
        <div className="px-6 py-5">
          <Link to="/" className="text-sm text-slate-400 hover:text-indigo-200 transition-colors">
            ← Torna alla home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-lg w-full">
            <div className="mb-8">
              <span className="inline-block text-4xl mb-5">🌿</span>
              <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
                Quanto riesci a leggere le tue emozioni?
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed">
                Questo breve percorso ti aiuterà a capire il tuo rapporto con il mondo emotivo.
                Non ci sono risposte giuste o sbagliate — solo la tua esperienza, così com'è.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-slate-500 text-lg shrink-0 mt-0.5">○</span>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-indigo-200">20 affermazioni</strong> su come percepisci e vivi le tue emozioni
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-slate-500 text-lg shrink-0 mt-0.5">○</span>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-indigo-200">5–7 minuti</strong> per completarlo, con la possibilità di tornare indietro
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-slate-500 text-lg shrink-0 mt-0.5">○</span>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Al termine riceverai un <strong className="text-indigo-200">profilo personalizzato</strong> del tuo modo di stare con le emozioni
                </p>
              </div>
            </div>

            <button
              onClick={() => setPhase('question')}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer text-lg shadow-lg shadow-indigo-500/30"
            >
              Inizia il percorso
            </button>

            <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
              Le tue risposte rimangono sul tuo dispositivo. Nessun dato viene condiviso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === totalQuestions;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-sm text-slate-400 hover:text-indigo-200 transition-colors cursor-pointer"
          >
            ← Torna all'ultima domanda
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-lg w-full">
            <div className="mb-8 text-center">
              <span className="text-5xl mb-4 block">✨</span>
              <h2 className="text-3xl font-bold text-slate-100 mb-3">Hai risposto a tutto.</h2>
              <p className="text-slate-300 leading-relaxed">
                Stai per scoprire il tuo profilo emotivo. Prenditi un momento, poi procedi quando sei pronto/a.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-300">Risposte date</span>
                <span className="text-sm font-semibold text-indigo-200">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {!allAnswered && (
              <div className="bg-amber-500/10 border border-amber-300/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-200">
                  Hai saltato {totalQuestions - answeredCount} domand{totalQuestions - answeredCount === 1 ? 'a' : 'e'}.
                  Torna indietro per completarle oppure procedi comunque.
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer text-lg mb-3 shadow-lg shadow-indigo-500/30"
            >
              Scopri il tuo profilo →
            </button>
            <button
              onClick={() => {
                setPhase('question');
                setCurrentIndex(0);
              }}
              className="w-full border border-white/15 hover:border-indigo-300/60 text-slate-300 hover:text-indigo-100 font-medium py-3.5 rounded-2xl transition-all cursor-pointer bg-white/5 hover:bg-white/10"
            >
              Ricomincia dall'inizio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-indigo-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-sm text-slate-400 hover:text-indigo-200 transition-colors cursor-pointer"
        >
          ← Indietro
        </button>
        <span className="text-xs text-slate-400 font-medium tracking-wide">
          Domanda {currentIndex + 1} di {totalQuestions}
        </span>
        <span className="text-xs text-slate-400 w-16 text-right">{progressPct}%</span>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div
          className="max-w-lg w-full"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        >
          <p className="text-2xl font-semibold text-slate-100 leading-snug mb-10 text-center">
            {currentQuestion.text}
          </p>

          <div className="flex flex-col gap-3">
            {LIKERT_LABELS.map((label, idx) => {
              const value = idx + 1;
              const isSelected = selectedValue === value;

              return (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  disabled={animating}
                  className={`
                    w-full py-3.5 px-6 rounded-2xl border text-sm font-medium transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-indigo-500 text-white border-indigo-400 scale-[1.02] shadow-md shadow-indigo-500/30'
                      : 'bg-white/5 text-slate-300 border-white/15 hover:border-indigo-300/60 hover:text-indigo-100 hover:scale-[1.01] hover:bg-white/10'
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-500 mt-8">
            Tocca una risposta per procedere automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}
