import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';

function hasTasResults(): boolean {
  try {
    const raw = localStorage.getItem('tas_results');
    if (!raw) return false;
    const data = JSON.parse(raw) as { score?: unknown };
    return typeof data?.score === 'number';
  } catch {
    return false;
  }
}

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && hasTasResults()) {
      setShowModal(false);
      return;
    }
    const timer = setTimeout(() => setShowModal(true), 4000);
    return () => clearTimeout(timer);
  }, [loading, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5">
        <BrandMark />
        <div className="flex items-center gap-6 text-sm text-slate-300">
          <button
            onClick={() => navigate('/test')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Take the Test
          </button>
          <Link to="/journal" className="hover:text-white transition-colors">
            Feelings Journal
          </Link>
          <Link to="/diario" className="hover:text-white transition-colors text-indigo-300 hover:text-indigo-100">
            Diario Emotivo
          </Link>
          <Link to="/mood" className="hover:text-white transition-colors text-emerald-400 hover:text-emerald-200">
            Mood Tracker
          </Link>
          {user && (
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <span className="text-slate-400 text-xs">{user.email}</span>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 py-20">
        <div className="max-w-3xl">
          <div className="inline-block bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
            Psychological Awareness Tool
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
            "Understanding your emotions" journey starts here
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            Alexithymia is the difficulty in identifying, describing, and processing your own emotions.
            It affects 1 in 10 people — almost always without them even knowing. Discover where you stand
            and learn to reconnect with your inner emotional world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/test')}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-500/30 cursor-pointer"
            >
              Take the Free Test
            </button>
            <Link
              to="/journal"
              className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-all cursor-pointer"
            >
              Open Feelings Journal
            </Link>
            <Link
              to="/diario"
              className="border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-indigo-100 font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 cursor-pointer"
            >
              🌿 Diario Emotivo Guidato
            </Link>
            <Link
              to="/mood"
              className="border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-emerald-200 font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 cursor-pointer"
            >
              🚀 Mood Tracker
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl w-full mt-10">
          {[
            {
              icon: '📋',
              title: 'Certified TAS-20 Test',
              desc: 'Take the Toronto Alexithymia Scale, the most trusted clinical tool, validated by psychologists worldwide.',
              to: '/test',
            },
            {
              icon: '📊',
              title: 'Detailed Score Breakdown',
              desc: 'See how you score across 3 emotional dimensions: identification, description, and externally-oriented thinking.',
              to: null,
            },
            {
              icon: '🗺️',
              title: 'Emotional Mapping',
              desc: 'Place your feelings on an interactive graph to visualize their intensity and quality in real time.',
              to: '/journal',
            },
            {
              icon: '🌿',
              title: 'Diario Emotivo Guidato',
              desc: 'Un percorso guidato in 4 passi per riconoscere le emozioni partendo dal corpo — pensato per chi fa fatica a nominarle.',
              to: '/diario',
              highlight: true,
            },
            {
              icon: '🚀',
              title: 'Daily Mood & Streak',
              desc: 'Log your mood every day, watch your streak circle fill, and see your monthly emotional patterns at a glance.',
              to: '/mood',
            },
          ].map((card) => (
            card.to ? (
              <Link
                key={card.title}
                to={card.to}
                className="rounded-2xl p-6 text-left transition-all hover:scale-[1.02] cursor-pointer block"
                style={
                  card.highlight
                    ? {
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }
                }
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
              </Link>
            ) : (
              <div
                key={card.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            )
          ))}
        </div>
      </main>


      {/* 10-second Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl shadow-indigo-900/50 animate-fade-in">
            <div className="text-5xl mb-4">💭</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Do you really feel your emotions?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Many people struggle to name or understand what they feel inside.
              Take our certified test to discover your emotional awareness level.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/test')}
                className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all hover:scale-105 cursor-pointer"
                style={{ borderRadius: '20px' }}
              >
                Take the Test Now!
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full text-slate-500 hover:text-slate-300 py-2.5 text-sm transition-colors cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
