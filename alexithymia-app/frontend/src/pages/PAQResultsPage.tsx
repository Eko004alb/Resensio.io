import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PAQ_SUBSCALE_INFO, PAQ_SUBSCALE_MAX, type PAQSubscale } from '../data/paq-questions';

interface LocationState {
  score: number;
  subscores: Record<PAQSubscale, number>;
}

const INTERPRETATION = [
  {
    label: 'Low Alexithymia',
    range: '24 – 61',
    min: 0,
    max: 61,
    color: 'emerald',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    hexColor: '#34d399',
    description:
      "You show strong emotional awareness across both positive and negative experiences. You are generally able to identify and communicate what you feel in a wide range of situations.",
  },
  {
    label: 'Possible Alexithymia',
    range: '62 – 74',
    min: 62,
    max: 74,
    color: 'amber',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    bar: 'bg-amber-500',
    hexColor: '#fbbf24',
    description:
      "Your score is in the borderline range. You may sometimes struggle to identify or describe your emotions, particularly in one type of emotional context. Journaling or speaking with a professional could be helpful.",
  },
  {
    label: 'High Alexithymia',
    range: '75 – 120',
    min: 75,
    max: 120,
    color: 'rose',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    bar: 'bg-rose-500',
    hexColor: '#fb7185',
    description:
      "Your score suggests significant difficulty identifying and describing your emotions. The PAQ breaks this down across positive and negative contexts — use your subscale results below to understand where the difficulty is strongest.",
  },
];

const SUBSCALE_ORDER: PAQSubscale[] = ['ndif', 'pdif', 'nddf', 'pddf', 'eot'];

export default function PAQResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center flex-col gap-4">
        <p className="text-slate-400">No results found.</p>
        <Link to="/paq" className="text-teal-400 hover:text-teal-300">
          Take the PAQ →
        </Link>
      </div>
    );
  }

  const { score, subscores } = state;
  const interp = INTERPRETATION.find((i) => score >= i.min && score <= i.max) ?? INTERPRETATION[2];
  // Score range: 24–120, so width spans 96 points
  const scorePct = Math.round(((score - 24) / 96) * 100);

  const colorBarMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    teal:   'bg-teal-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    rose:   'bg-rose-500',
  };
  const colorTextMap: Record<string, string> = {
    indigo: 'text-indigo-400',
    teal:   'text-teal-400',
    violet: 'text-violet-400',
    purple: 'text-purple-400',
    rose:   'text-rose-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back */}
        <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors mb-8 inline-block">
          ← Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Your PAQ Results</h1>
        <p className="text-slate-400 text-sm mb-10">
          Based on the Perth Alexithymia Questionnaire (PAQ) · Preece et al. (2018)
        </p>

        {/* Score Card */}
        <div className={`rounded-3xl border p-8 mb-8 ${interp.bg} ${interp.border}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${interp.text}`}>
                {interp.label}
              </div>
              <div className="text-6xl font-bold text-white">{score}</div>
              <div className="text-slate-400 text-sm mt-1">out of 120 · range: {interp.range}</div>
            </div>
            <div
              className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ borderColor: interp.hexColor, color: interp.hexColor }}
            >
              {score}
            </div>
          </div>

          {/* Score Bar */}
          <div className="mb-6">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${interp.bar}`}
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>24 (low)</span>
              <span>61</span>
              <span>74</span>
              <span>120 (high)</span>
            </div>
          </div>

          <p className="text-slate-200 leading-relaxed text-sm">{interp.description}</p>
        </div>

        {/* Subscale Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
          <h2 className="font-semibold text-white mb-1 text-lg">Subscale Breakdown</h2>
          <p className="text-slate-500 text-xs mb-5 leading-relaxed">
            The PAQ separates alexithymia into positive and negative emotional contexts.
            Higher scores in any subscale indicate more difficulty in that area.
          </p>
          <div className="flex flex-col gap-5">
            {SUBSCALE_ORDER.map((key) => {
              const info = PAQ_SUBSCALE_INFO[key];
              const rawScore = subscores[key];
              const max = PAQ_SUBSCALE_MAX[key];
              const pct = Math.round((rawScore / max) * 100);

              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-300">{info.label}</span>
                    <span className={`text-sm font-semibold ${colorTextMap[info.color]}`}>
                      {rawScore} / {max}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${colorBarMap[info.color]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-8">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Note:</strong> This self-report assessment is for awareness purposes only.
            It is not a clinical diagnosis. If you are concerned about your emotional health, please consult a qualified
            mental health professional.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/journal')}
            className="flex-1 bg-teal-500 hover:bg-teal-400 text-white font-semibold py-3.5 rounded-xl transition-all hover:scale-105 cursor-pointer text-center"
          >
            Start Feelings Journal →
          </button>
          <button
            onClick={() => navigate('/paq')}
            className="flex-1 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold py-3.5 rounded-xl transition-all cursor-pointer"
          >
            Retake the PAQ
          </button>
        </div>

        {/* Back to TAS-20 */}
        <div className="mt-4">
          <Link
            to="/test"
            className="block w-full text-center border border-slate-700/50 hover:border-indigo-500/40 text-slate-500 hover:text-indigo-400 font-medium py-3.5 rounded-xl transition-all text-sm"
          >
            ← Back to TAS-20 Test
          </Link>
        </div>
      </div>
    </div>
  );
}
