'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

type Phase = 'entry' | 'blessing' | 'exit';

type Particle = {
  left: string;
  top: string;
  delay: string;
  duration: string;
  size: number;
};

type Petal = {
  left: string;
  delay: string;
  duration: string;
  rotate: string;
};

const particles: Particle[] = [
  { left: '10%', top: '14%', delay: '0s', duration: '4.5s', size: 8 },
  { left: '22%', top: '22%', delay: '0.5s', duration: '5.2s', size: 10 },
  { left: '36%', top: '10%', delay: '1.2s', duration: '4.8s', size: 7 },
  { left: '58%', top: '16%', delay: '0.8s', duration: '5.4s', size: 9 },
  { left: '73%', top: '12%', delay: '1.6s', duration: '4.9s', size: 8 },
  { left: '84%', top: '24%', delay: '0.4s', duration: '5.7s', size: 11 },
  { left: '91%', top: '18%', delay: '1.8s', duration: '5.1s', size: 7 }
];

const petals: Petal[] = [
  { left: '8%', delay: '0s', duration: '8.5s', rotate: '8deg' },
  { left: '24%', delay: '1.2s', duration: '9.2s', rotate: '-12deg' },
  { left: '41%', delay: '0.6s', duration: '8.8s', rotate: '14deg' },
  { left: '57%', delay: '1.8s', duration: '9.6s', rotate: '-10deg' },
  { left: '73%', delay: '0.3s', duration: '8.9s', rotate: '9deg' },
  { left: '88%', delay: '1.4s', duration: '9.4s', rotate: '-8deg' }
];

function isFestivalActive() {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), 9, 19, 23, 59, 59, 999);
  return now <= endDate;
}

function buildSessionKey() {
  const year = new Date().getFullYear();
  return `near-kart-dussehra-${year}-shown`;
}

function DurgaFigure({ phase }: { phase: Phase }) {
  const blessingActive = phase !== 'entry';

  return (
    <svg viewBox="0 0 360 440" className="h-auto w-full drop-shadow-[0_20px_60px_rgba(120,42,10,0.35)]" role="img" aria-label="Stylised festive illustration of Goddess Durga">
      <defs>
        <radialGradient id="durga-aura" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(255,244,179,0.95)" />
          <stop offset="55%" stopColor="rgba(255,184,77,0.65)" />
          <stop offset="100%" stopColor="rgba(255,184,77,0)" />
        </radialGradient>
        <linearGradient id="durga-robe" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#c81e1e" />
          <stop offset="55%" stopColor="#e85b28" />
          <stop offset="100%" stopColor="#8f0c1f" />
        </linearGradient>
        <linearGradient id="durga-gold" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#f5b942" />
          <stop offset="100%" stopColor="#b77912" />
        </linearGradient>
        <linearGradient id="durga-skin" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#f7d7b5" />
          <stop offset="100%" stopColor="#efc39a" />
        </linearGradient>
      </defs>

      <ellipse cx="180" cy="170" rx="130" ry="150" fill="url(#durga-aura)" />
      <ellipse cx="180" cy="360" rx="130" ry="45" fill="rgba(127,29,29,0.16)" />

      <g opacity="0.92">
        <path d="M82 354C102 314 136 292 180 292C224 292 258 314 278 354C248 340 216 332 180 332C144 332 112 340 82 354Z" fill="#f6c453" />
        <path d="M95 362C113 328 143 308 180 308C217 308 247 328 265 362C237 350 208 344 180 344C152 344 123 350 95 362Z" fill="#ffdf82" opacity="0.9" />
      </g>

      <motion.g
        initial={false}
        animate={blessingActive ? { rotate: -12, x: 4, y: -12 } : { rotate: 22, x: 40, y: 18 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '252px 214px' }}
      >
        <path d="M212 214C228 206 241 205 252 212C263 219 266 231 262 248L249 248C250 236 247 228 240 224C233 220 225 221 216 228Z" fill="url(#durga-skin)" />
        <circle cx="258" cy="213" r="17" fill="url(#durga-skin)" />
        <path d="M252 198C259 203 262 211 261 219C253 220 246 217 240 211C243 204 247 200 252 198Z" fill="#f8d57c" opacity="0.8" />
      </motion.g>

      <g>
        <path d="M149 226C136 212 122 205 106 206C90 207 77 216 66 234L79 241C88 228 98 221 108 220C118 219 129 225 140 238Z" fill="url(#durga-skin)" />
        <circle cx="60" cy="240" r="15" fill="url(#durga-skin)" />
      </g>

      <g>
        <path d="M106 155C124 118 149 100 180 100C211 100 236 118 254 155L242 252H118Z" fill="url(#durga-robe)" />
        <path d="M140 260C148 224 161 198 180 182C199 198 212 224 220 260Z" fill="#f59e0b" opacity="0.82" />
        <path d="M122 250H238L256 342H104Z" fill="url(#durga-robe)" />
        <path d="M156 155H204V250H156Z" fill="#f3b343" opacity="0.88" />
      </g>

      <g>
        <path d="M126 122C138 89 156 72 180 72C204 72 222 89 234 122L221 132C210 105 196 92 180 92C164 92 150 105 139 132Z" fill="#31111d" />
        <ellipse cx="180" cy="136" rx="52" ry="60" fill="#2c0b15" opacity="0.88" />
        <ellipse cx="180" cy="139" rx="37" ry="48" fill="url(#durga-skin)" />
        <circle cx="166" cy="136" r="3.5" fill="#5b1910" />
        <circle cx="194" cy="136" r="3.5" fill="#5b1910" />
        <path d="M166 160C175 166 185 166 194 160" stroke="#8a1c1c" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M180 109L186 123L180 131L174 123Z" fill="#b91c1c" />
      </g>

      <g>
        <path d="M180 40L202 67H158Z" fill="url(#durga-gold)" />
        <path d="M131 88L145 52L162 84Z" fill="url(#durga-gold)" />
        <path d="M229 88L215 52L198 84Z" fill="url(#durga-gold)" />
        <path d="M140 95C157 56 170 37 180 37C190 37 203 56 220 95" fill="none" stroke="url(#durga-gold)" strokeWidth="10" strokeLinecap="round" />
        <circle cx="180" cy="53" r="11" fill="#fff3b0" />
      </g>

      <g>
        <ellipse cx="124" cy="180" rx="14" ry="25" fill="#f5c49f" opacity="0.92" />
        <ellipse cx="236" cy="180" rx="14" ry="25" fill="#f5c49f" opacity="0.92" />
      </g>
    </svg>
  );
}

export function DussehraBlessingOverlay() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('entry');
  const [visible, setVisible] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chimeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined' || !isFestivalActive()) {
      return;
    }

    const sessionKey = buildSessionKey();
    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    window.sessionStorage.setItem(sessionKey, '1');
    setVisible(true);

    const blessingTimer = window.setTimeout(() => setPhase('blessing'), 3200);
    const exitTimer = window.setTimeout(() => setPhase('exit'), 9200);
    const hideTimer = window.setTimeout(() => setVisible(false), 10300);

    return () => {
      window.clearTimeout(blessingTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const stopAudio = () => {
      if (chimeIntervalRef.current != null) {
        window.clearInterval(chimeIntervalRef.current);
        chimeIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.suspend().catch(() => undefined);
      }
    };

    const playChime = () => {
      const context = audioContextRef.current;
      if (!context) {
        return;
      }

      const time = context.currentTime;
      const strikeOne = context.createOscillator();
      const strikeTwo = context.createOscillator();
      const gain = context.createGain();

      strikeOne.type = 'sine';
      strikeOne.frequency.setValueAtTime(512, time);
      strikeOne.frequency.exponentialRampToValueAtTime(226, time + 1.9);
      strikeTwo.type = 'triangle';
      strikeTwo.frequency.setValueAtTime(784, time + 0.04);
      strikeTwo.frequency.exponentialRampToValueAtTime(348, time + 1.4);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.08, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.1);

      strikeOne.connect(gain);
      strikeTwo.connect(gain);
      gain.connect(context.destination);

      strikeOne.start(time);
      strikeTwo.start(time + 0.03);
      strikeOne.stop(time + 2.2);
      strikeTwo.stop(time + 1.8);
    };

    const startAudio = async () => {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        return;
      }

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextCtor();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume().catch(() => undefined);
      }

      playChime();
      if (chimeIntervalRef.current == null) {
        chimeIntervalRef.current = window.setInterval(playChime, 2400);
      }
    };

    if (!mounted || !visible || !audioEnabled) {
      stopAudio();
      return stopAudio;
    }

    void startAudio();
    return stopAudio;
  }, [audioEnabled, mounted, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="dussehra-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'exit' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'exit' ? 1 : 0.9, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,237,160,0.2),_rgba(120,24,24,0.82)_38%,_rgba(34,12,12,0.94)_100%)] backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,245,157,0.12),_transparent_35%,_rgba(251,191,36,0.12)_65%,_rgba(127,29,29,0.18)_100%)]" />

          {particles.map((particle) => (
            <span
              key={`${particle.left}-${particle.top}`}
              className="sparkle"
              style={{
                left: particle.left,
                top: particle.top,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}

          {petals.map((petal) => (
            <span
              key={`${petal.left}-${petal.delay}`}
              className="petal"
              style={{
                left: petal.left,
                animationDelay: petal.delay,
                animationDuration: petal.duration,
                '--petal-rotate': petal.rotate
              } as CSSProperties}
            />
          ))}

          <div className="light-rays" />
          <div className="pointer-events-none absolute inset-x-5 top-6 z-10 flex items-center justify-between text-[#f5d56b] opacity-80 sm:inset-x-10">
            <div className="bell" />
            <div className="bell" />
          </div>
          <div className="diya diya-left" />
          <div className="diya diya-right" />

          <div className="relative z-20 flex h-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
            <motion.div
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: phase === 'exit' ? 12 : 0, scale: phase === 'exit' ? 0.98 : 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="festival-shell relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#f6d57c]/30 bg-[linear-gradient(145deg,rgba(108,28,28,0.78),rgba(63,18,18,0.92))] shadow-[0_30px_120px_rgba(17,24,39,0.55)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,243,176,0.26),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_32%)]" />
              <div className="relative grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-10">
                <div className="flex flex-col justify-center text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#f8dd83] sm:text-sm">Dussehra blessings</p>
                  <motion.h2
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: phase === 'exit' ? 0 : 1, y: phase === 'exit' ? -10 : 0 }}
                    transition={{ delay: 2.3, duration: 0.8, ease: 'easeOut' }}
                    className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#fff7db] sm:text-4xl lg:text-5xl"
                  >
                    Happy Dussehra
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: phase === 'exit' ? 0 : 1, y: phase === 'exit' ? 16 : 0 }}
                    transition={{ delay: 2.8, duration: 0.9, ease: 'easeOut' }}
                    className="mt-4 max-w-2xl text-sm leading-7 text-[#fff6e6] sm:text-base lg:text-lg"
                  >
                    May Goddess Durga bless you and your family with prosperity, happiness, and success.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: phase === 'exit' ? 0 : 1, y: phase === 'exit' ? 20 : 0 }}
                    transition={{ delay: 3.2, duration: 0.9, ease: 'easeOut' }}
                    className="mt-6 rounded-[1.75rem] border border-[#f7d774]/25 bg-white/10 px-4 py-4 text-sm leading-6 text-[#ffe8b0] backdrop-blur"
                  >
                    Divine light, soft petals, golden warmth, and a respectful festive blessing welcome every visitor once per session before gracefully fading away.
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: phase === 'exit' ? 0 : 1, y: phase === 'exit' ? 20 : 0 }}
                    transition={{ delay: 3.5, duration: 0.8, ease: 'easeOut' }}
                    className="mt-6 flex flex-wrap gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setAudioEnabled((current) => !current)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#f8dd83]/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-[#fff2c7] transition hover:bg-white/15"
                    >
                      {audioEnabled ? 'Mute temple bells' : 'Play temple bells'}
                    </button>
                    <span className="inline-flex min-h-[44px] items-center rounded-full border border-white/10 bg-black/10 px-5 py-2.5 text-sm text-[#ffe8b0]">
                      Blessing ends automatically in a few seconds
                    </span>
                  </motion.div>
                </div>

                <div className="relative flex min-h-[320px] items-center justify-center sm:min-h-[420px]">
                  <motion.div
                    initial={{ opacity: 0, x: '20vw', scale: 0.94, rotateY: -16 }}
                    animate={phase === 'exit'
                      ? { opacity: 0, x: '4vw', scale: 0.98, rotateY: 4 }
                      : { opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                    transition={{ duration: phase === 'entry' ? 2.4 : 1, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-[330px] transform-gpu [transform-style:preserve-3d] sm:max-w-[380px] lg:max-w-[420px]"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: phase === 'exit' ? 0 : 1, scale: 1 }}
                      transition={{ duration: 1.6, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,245,190,0.34),_rgba(255,196,77,0.12)_46%,_transparent_70%)] blur-2xl"
                    />
                    <DurgaFigure phase={phase} />
                    <AnimatePresence>
                      {phase === 'blessing' ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1.15 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="absolute right-[8%] top-[34%] h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgba(255,244,179,0.92),_rgba(251,191,36,0.48)_46%,_rgba(251,191,36,0)_76%)] blur-md"
                        />
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          <style jsx>{`
            .festival-shell::before {
              content: '';
              position: absolute;
              inset: 18px;
              border-radius: 1.6rem;
              border: 1px solid rgba(248, 221, 131, 0.16);
              pointer-events: none;
            }

            .sparkle {
              position: absolute;
              display: block;
              border-radius: 9999px;
              background: radial-gradient(circle, rgba(255, 243, 176, 0.98), rgba(251, 191, 36, 0.4) 60%, rgba(251, 191, 36, 0));
              box-shadow: 0 0 18px rgba(251, 191, 36, 0.55);
              animation: twinkle linear infinite;
            }

            .petal {
              position: absolute;
              top: -12%;
              width: 16px;
              height: 24px;
              border-radius: 70% 30% 70% 30%;
              background: linear-gradient(180deg, rgba(255, 234, 161, 0.95), rgba(214, 58, 58, 0.9));
              box-shadow: 0 12px 18px rgba(79, 16, 16, 0.18);
              animation: drift linear infinite;
              --petal-rotate: 0deg;
            }

            .light-rays {
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at center, rgba(255, 248, 214, 0.14), transparent 54%), repeating-conic-gradient(from 0deg, rgba(255, 231, 166, 0.12) 0deg 10deg, transparent 10deg 28deg);
              opacity: 0.55;
              mix-blend-mode: screen;
              animation: breathe 7s ease-in-out infinite;
            }

            .bell {
              position: relative;
              width: 18px;
              height: 16px;
              border-radius: 9999px 9999px 10px 10px;
              background: linear-gradient(180deg, #ffe59a, #f0a718 80%);
              box-shadow: 0 0 18px rgba(251, 191, 36, 0.24);
            }

            .bell::before {
              content: '';
              position: absolute;
              left: 50%;
              top: -7px;
              width: 4px;
              height: 8px;
              transform: translateX(-50%);
              border-radius: 9999px;
              background: #f8dd83;
            }

            .bell::after {
              content: '';
              position: absolute;
              left: 50%;
              bottom: -3px;
              width: 6px;
              height: 6px;
              transform: translateX(-50%);
              border-radius: 9999px;
              background: #f5b942;
            }

            .diya {
              position: absolute;
              bottom: 24px;
              width: 92px;
              height: 52px;
              border-radius: 0 0 9999px 9999px;
              background: linear-gradient(180deg, #ef7a1a, #a8321c 90%);
              box-shadow: 0 12px 35px rgba(127, 29, 29, 0.28);
            }

            .diya::before {
              content: '';
              position: absolute;
              left: 50%;
              top: -27px;
              width: 24px;
              height: 34px;
              transform: translateX(-50%);
              border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
              background: radial-gradient(circle at 50% 30%, rgba(255, 251, 235, 0.98), rgba(253, 224, 71, 0.85) 32%, rgba(249, 115, 22, 0.92) 75%);
              filter: drop-shadow(0 0 18px rgba(251, 191, 36, 0.55));
              animation: flicker 1.8s ease-in-out infinite;
            }

            .diya::after {
              content: '';
              position: absolute;
              left: 50%;
              top: 8px;
              width: 58px;
              height: 8px;
              transform: translateX(-50%);
              border-radius: 9999px;
              background: rgba(255, 240, 191, 0.35);
            }

            .diya-left {
              left: 18px;
            }

            .diya-right {
              right: 18px;
            }

            @keyframes twinkle {
              0%, 100% {
                opacity: 0.22;
                transform: translateY(0) scale(0.85);
              }
              50% {
                opacity: 1;
                transform: translateY(-14px) scale(1.1);
              }
            }

            @keyframes drift {
              0% {
                opacity: 0;
                transform: translate3d(0, -6vh, 0) rotate(var(--petal-rotate));
              }
              15% {
                opacity: 0.95;
              }
              100% {
                opacity: 0;
                transform: translate3d(36px, 105vh, 0) rotate(calc(var(--petal-rotate) + 240deg));
              }
            }

            @keyframes flicker {
              0%, 100% {
                transform: translateX(-50%) scale(0.98);
              }
              40% {
                transform: translateX(-50%) scale(1.08) translateY(-2px);
              }
              70% {
                transform: translateX(-50%) scale(0.95);
              }
            }

            @keyframes breathe {
              0%, 100% {
                transform: scale(1);
                opacity: 0.5;
              }
              50% {
                transform: scale(1.04);
                opacity: 0.72;
              }
            }

            @media (max-width: 767px) {
              .diya {
                width: 72px;
                height: 42px;
                bottom: 14px;
              }

              .diya::before {
                width: 19px;
                height: 28px;
                top: -22px;
              }

              .diya-left {
                left: 10px;
              }

              .diya-right {
                right: 10px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .sparkle,
              .petal,
              .light-rays,
              .diya::before {
                animation: none;
              }
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
