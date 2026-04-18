import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SUBSCALE_INFO, type Subscale } from '../data/questions';

interface LocationState {
  score: number;
  subscores: Record<Subscale, number>;
}

const SUBSCALE_MAX: Record<Subscale, number> = {
  dif: 35,
  ddf: 25,
  eot: 40,
};

const INTERPRETATION = [
  {
    band: 'low',
    min: 0,
    max: 51,
    label: 'Buona consapevolezza emotiva',
    tagline: 'Riesci generalmente a riconoscere e nominare quello che senti.',
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    bar: 'bg-emerald-500',
    pill: 'bg-emerald-100 text-emerald-700',
    detail: "Il tuo punteggio indica che hai una buona connessione con il tuo mondo interiore. Riesci, nella maggior parte dei casi, a identificare quello che provi e a trovare le parole per esprimerlo. Continua a coltivare questa consapevolezza — è una risorsa preziosa.",
  },
  {
    band: 'mid',
    min: 52,
    max: 60,
    label: 'Alcune difficoltà con le emozioni',
    tagline: 'A volte fai fatica a mettere a fuoco o a esprimere quello che senti.',
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    bar: 'bg-amber-400',
    pill: 'bg-amber-100 text-amber-700',
    detail: "Il tuo punteggio è nella fascia intermedia. Ci sono momenti in cui riconosci bene le tue emozioni, e altri in cui ti sembra più difficile capire cosa stai davvero provando. Questo è più comune di quanto pensi, e c'è molto che puoi fare per approfondire la tua consapevolezza.",
  },
  {
    band: 'high',
    min: 61,
    max: 100,
    label: 'Significative difficoltà con le emozioni',
    tagline: 'Riconoscere ed esprimere le tue emozioni richiede spesso un grande sforzo.',
    color: 'rose',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    bar: 'bg-rose-400',
    pill: 'bg-rose-100 text-rose-700',
    detail: "Il tuo punteggio indica che hai una relazione complessa con le tue emozioni. Potresti spesso sentirti a disagio di fronte a domande su come ti senti, preferire concentrarti sui fatti piuttosto che sulle sensazioni interiori, o farti notare che sei \"poco espressivo/a\". Non sei solo/a in questo.",
  },
];

const SUBSCALE_ORDER: Subscale[] = ['dif', 'ddf', 'eot'];

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const [barsVisible, setBarsVisible] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBarsVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-[#faf4eb] text-stone-700 flex items-center justify-center flex-col gap-4 px-6">
        <p className="text-stone-400 text-center">Nessun risultato trovato. Completa prima il test.</p>
        <Link
          to="/test"
          className="mt-2 bg-stone-800 text-white font-medium py-3 px-6 rounded-2xl hover:bg-stone-700 transition-colors"
        >
          Inizia il test →
        </Link>
      </div>
    );
  }

  const { score, subscores } = state;
  const interp = INTERPRETATION.find((i) => score >= i.min && score <= i.max) ?? INTERPRETATION[2];

  const colorBarMap: Record<string, string> = {
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
    sky: 'bg-sky-400',
  };
  const colorTextMap: Record<string, string> = {
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    sky: 'text-sky-600',
  };

  return (
    <div className="min-h-screen bg-[#faf4eb]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back */}
        <Link
          to="/"
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors mb-10 inline-block"
        >
          ← Torna alla home
        </Link>

        {/* 1 — Validation */}
        <div className="mb-10">
          <p className="text-2xl font-semibold text-stone-800 leading-snug mb-3">
            Quello che senti è reale e ha un senso.
          </p>
          <p className="text-stone-500 leading-relaxed">
            Hai appena dedicato del tempo a osservare te stesso/a. Questo, in sé, è già un atto di cura.
            I risultati che trovi qui non ti definiscono — ti raccontano, in questo momento, una parte del tuo modo di stare al mondo.
          </p>
        </div>

        {/* 2 — Score band */}
        <div className={`rounded-3xl border p-7 mb-8 ${interp.bg} ${interp.border}`}>
          <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-3 ${interp.text}`}>
            Il tuo profilo emotivo
          </span>
          <h2 className={`text-2xl font-bold mb-2 ${interp.text}`}>{interp.label}</h2>
          <p className={`text-sm font-medium mb-5 ${interp.text} opacity-80`}>{interp.tagline}</p>
          <p className="text-stone-600 leading-relaxed text-sm">{interp.detail}</p>
        </div>

        {/* 3 — Alexithymia reveal */}
        <div className="bg-[#fdf8f2] border border-stone-200/60 rounded-3xl p-7 mb-8">
          <p className="text-stone-700 leading-relaxed mb-4">
            Molte persone vivono questa difficoltà nel dare un nome alle proprie emozioni senza sapere che esiste
            un termine per descriverla. In psicologia, questo modo di sentire si chiama{' '}
            <strong className="text-stone-900">Alessitimia</strong>.
          </p>
          <p className="text-stone-500 leading-relaxed text-sm mb-4">
            Il termine viene dal greco e significa letteralmente <em>"senza parole per le emozioni"</em>.
            Non è una malattia, né un disturbo: è un <strong className="text-stone-700">tratto</strong> —
            un modo di elaborare le esperienze interiori che è più diffuso di quanto si pensi.
          </p>
          <p className="text-stone-500 leading-relaxed text-sm">
            La buona notizia è che riconoscerla è già il primo passo. Attraverso pratiche come il journaling,
            la mindfulness e il supporto psicologico, è possibile sviluppare progressivamente una maggiore
            familiarità con il proprio mondo emotivo.
          </p>
        </div>

        {/* 4 — Subscale breakdown */}
        <div className="bg-[#fdf8f2] border border-stone-200/60 rounded-3xl p-7 mb-8" ref={barsRef}>
          <h3 className="text-stone-800 font-semibold text-lg mb-1">Le tre aree del tuo profilo</h3>
          <p className="text-stone-400 text-sm mb-7">
            Il test misura tre aspetti distinti del tuo rapporto con le emozioni. Ecco dove incontri più o meno sfide.
          </p>

          <div className="flex flex-col gap-7">
            {SUBSCALE_ORDER.map((key) => {
              const info = SUBSCALE_INFO[key];
              const rawScore = subscores[key];
              const max = SUBSCALE_MAX[key];
              const pct = Math.round((rawScore / max) * 100);

              return (
                <div key={key}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className={`text-sm font-semibold ${colorTextMap[info.color]}`}>{info.label}</span>
                    <span className="text-xs text-stone-400">{rawScore} / {max}</span>
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${colorBarMap[info.color]}`}
                      style={{ width: barsVisible ? `${pct}%` : '0%' }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{info.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 — Score note + disclaimer */}
        <div className="bg-[#f5ede0] border border-stone-200/60 rounded-2xl p-4 mb-8">
          <p className="text-xs text-stone-400 leading-relaxed">
            <strong className="text-stone-500">Punteggio grezzo: {score} / 100</strong> — Basato sulla Toronto Alexithymia Scale
            (TAS-20, Bagby, Parker & Taylor, 1994). Questa autovalutazione è a scopo conoscitivo e non costituisce
            una diagnosi clinica. Se hai dubbi sul tuo benessere emotivo, considera di parlarne con un professionista della salute mentale.
          </p>
        </div>

        {/* 6 — CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => navigate('/journal')}
            className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-semibold py-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer text-center"
          >
            Inizia il diario delle emozioni →
          </button>
          <button
            onClick={() => navigate('/test')}
            className="flex-1 border border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-800 font-semibold py-4 rounded-2xl transition-all cursor-pointer"
          >
            Rifai il test
          </button>
        </div>

        {/* PAQ suggestion */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-sky-700 mb-1">
              Vuoi un quadro ancora più preciso?
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Il <strong className="text-stone-600">Perth Alexithymia Questionnaire (PAQ)</strong> è uno strumento
              più recente che misura l'alessitimia separatamente nelle emozioni positive e in quelle negative,
              offrendoti un'immagine più sfumata e accurata del tuo profilo emotivo.
            </p>
          </div>
          <button
            onClick={() => navigate('/paq')}
            className="w-full bg-sky-100 hover:bg-sky-200 border border-sky-200 hover:border-sky-300 text-sky-700 font-medium py-3 rounded-xl transition-all text-sm cursor-pointer"
          >
            Prova il PAQ →
          </button>
        </div>
      </div>
    </div>
  );
}
