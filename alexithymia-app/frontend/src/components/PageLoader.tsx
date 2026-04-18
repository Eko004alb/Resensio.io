import { useEffect, useState } from 'react';

interface PageLoaderProps {
  exiting?: boolean;
}

export default function PageLoader({ exiting = false }: PageLoaderProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes loaderFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes loaderFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1);   opacity: 0.75; }
          50%       { transform: scale(1.25); opacity: 1;    }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-8px); }
        }
        @keyframes orb2Float {
          0%, 100% { transform: translateY(0px) scale(1);   opacity: 0.4; }
          50%       { transform: translateY(10px) scale(1.1); opacity: 0.6; }
        }
        @keyframes orb3Float {
          0%, 100% { transform: translateX(0px);  }
          50%       { transform: translateX(10px); }
        }
        @keyframes barFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: exiting
            ? 'loaderFadeOut 0.22s ease forwards'
            : 'loaderFadeIn 0.25s ease forwards',
        }}
      >
        {/* Background ambient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            animation: 'orb2Float 4s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '15%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
            animation: 'orb3Float 5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Central glow orb */}
        <div
          style={{
            position: 'relative',
            width: 72,
            height: 72,
            marginBottom: 28,
            animation: 'orbFloat 2.4s ease-in-out infinite',
          }}
        >
          {/* Outer glow ring */}
          <div
            style={{
              position: 'absolute',
              inset: -16,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(129,140,248,0.18) 0%, transparent 70%)',
              animation: 'orbPulse 2.4s ease-in-out infinite',
            }}
          />
          {/* Inner orb */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(199,210,254,0.9) 0%, rgba(129,140,248,0.7) 40%, rgba(79,70,229,0.5) 100%)',
              boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)',
            }}
          />
        </div>

        {/* Wordmark */}
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            fontWeight: 600,
            color: 'rgba(199,210,254,0.55)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Resensio
        </p>

        {/* Animated dots */}
        <p
          style={{
            fontSize: 13,
            color: 'rgba(148,163,184,0.5)',
            fontWeight: 400,
            letterSpacing: '0.05em',
            minWidth: 60,
            textAlign: 'center',
          }}
        >
          {'.'.repeat(dots + 1)}
        </p>

        {/* Bottom progress bar */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(99,102,241,0.15)',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #4f46e5, #818cf8, #c7d2fe, #818cf8)',
              backgroundSize: '200% auto',
              animation: `barFill 1s cubic-bezier(0.4,0,0.2,1) forwards, shimmer 1.5s linear infinite`,
            }}
          />
        </div>
      </div>
    </>
  );
}
