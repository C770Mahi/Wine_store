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
    <svg viewBox="0 0 420 520" className="h-auto w-full drop-shadow-[0_30px_90px_rgba(120,42,10,0.38)]" role="img" aria-label="Festive premium illustration of Goddess Durga">
      <defs>
        <radialGradient id="durga-aura-core" cx="50%" cy="42%" r="48%">
          <stop offset="0%" stopColor="#fff7d1" stopOpacity="0.96" />
          <stop offset="48%" stopColor="#ffd166" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="durga-aura-shell" cx="50%" cy="42%" r="66%">
          <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.3" />
          <stop offset="58%" stopColor="#fb923c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="durga-robe-main" x1="10%" x2="90%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#ff7a45" />
          <stop offset="40%" stopColor="#d62839" />
          <stop offset="100%" stopColor="#6f1024" />
        </linearGradient>
        <linearGradient id="durga-robe-shadow" x1="0%" x2="100%" y1="10%" y2="100%">
          <stop offset="0%" stopColor="#f6c453" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="durga-gold" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fff4ba" />
          <stop offset="45%" stopColor="#f7c948" />
          <stop offset="100%" stopColor="#b7791f" />
        </linearGradient>
        <linearGradient id="durga-gold-deep" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe9a6" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="durga-skin" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#f9dfc3" />
          <stop offset="55%" stopColor="#f2c8a5" />
          <stop offset="100%" stopColor="#deaa83" />
        </linearGradient>
        <linearGradient id="durga-hair" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#451a24" />
          <stop offset="100%" stopColor="#16070d" />
        </linearGradient>
        <linearGradient id="durga-metal" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="45%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
        <filter id="durga-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.g
        initial={false}
        animate={phase === 'entry' ? { rotate: -3 } : { rotate: 3 }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, repeatType: 'mirror', ease: 'easeInOut' }}
        style={{ transformOrigin: '210px 206px' }}
      >
        <ellipse cx="210" cy="205" rx="164" ry="184" fill="url(#durga-aura-shell)" />
        <ellipse cx="210" cy="205" rx="136" ry="158" fill="url(#durga-aura-core)" filter="url(#durga-soft-glow)" />
      </motion.g>

      <g opacity="0.88">
        <path d="M119 420C145 372 176 348 210 348C244 348 275 372 301 420C269 407 239 401 210 401C181 401 151 407 119 420Z" fill="#f5c44c" />
        <path d="M96 444C122 397 160 370 210 370C260 370 298 397 324 444C290 431 252 424 210 424C168 424 130 431 96 444Z" fill="#ffe18c" opacity="0.94" />
      </g>

      <g opacity="0.94">
        <path d="M93 248C74 240 61 226 54 206C73 206 92 220 111 248Z" fill="url(#durga-metal)" />
        <path d="M113 230C104 213 94 202 84 196C74 190 64 188 54 191" fill="none" stroke="url(#durga-skin)" strokeWidth="14" strokeLinecap="round" />
        <circle cx="49" cy="190" r="14" fill="url(#durga-skin)" />
        <circle cx="44" cy="190" r="10" fill="#fff7d1" opacity="0.68" />
      </g>

      <g opacity="0.94">
        <path d="M327 172V280" stroke="url(#durga-gold-deep)" strokeWidth="7" strokeLinecap="round" />
        <path d="M327 156L345 188H309Z" fill="url(#durga-metal)" />
        <path d="M327 142L339 166H315Z" fill="url(#durga-gold)" />
        <path d="M289 234C298 214 307 201 317 195C327 189 338 190 351 198" fill="none" stroke="url(#durga-skin)" strokeWidth="14" strokeLinecap="round" />
        <circle cx="357" cy="201" r="14" fill="url(#durga-skin)" />
      </g>

      <g>
        <path d="M129 210C141 170 168 144 210 144C252 144 279 170 291 210L279 326H141Z" fill="url(#durga-robe-main)" />
        <path d="M162 226C171 198 187 177 210 164C233 177 249 198 258 226L249 345H171Z" fill="url(#durga-robe-shadow)" opacity="0.94" />
        <path d="M145 324H275L302 438H118Z" fill="url(#durga-robe-main)" />
        <path d="M193 149H227V338H193Z" fill="url(#durga-gold)" opacity="0.9" />
        <path d="M152 339C173 322 192 312 210 308C228 312 247 322 268 339L253 384H167Z" fill="#f59e0b" opacity="0.76" />
      </g>

      <g>
        <path d="M144 163C156 113 179 86 210 86C241 86 264 113 276 163L262 174C250 132 233 111 210 111C187 111 170 132 158 174Z" fill="url(#durga-hair)" />
        <ellipse cx="210" cy="176" rx="66" ry="78" fill="url(#durga-hair)" opacity="0.96" />
        <ellipse cx="210" cy="180" rx="46" ry="61" fill="url(#durga-skin)" />
        <ellipse cx="193" cy="177" rx="4.4" ry="5.2" fill="#5b1f1f" />
        <ellipse cx="227" cy="177" rx="4.4" ry="5.2" fill="#5b1f1f" />
        <path d="M183 165C188 161 194 160 199 162" stroke="#6b1b1b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M221 162C226 160 232 161 237 165" stroke="#6b1b1b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M199 203C206 208 214 208 221 203" stroke="#a32128" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M210 142L217 156L210 166L203 156Z" fill="#c81e1e" />
        <path d="M209 178L213 191L207 191Z" fill="#d18b5b" />
        <circle cx="170" cy="195" r="14" fill="url(#durga-gold)" opacity="0.9" />
        <circle cx="250" cy="195" r="14" fill="url(#durga-gold)" opacity="0.9" />
      </g>

      <g>
        <path d="M210 52L232 86H188Z" fill="url(#durga-gold)" />
        <path d="M165 106L179 60L197 97Z" fill="url(#durga-gold)" />
        <path d="M255 106L241 60L223 97Z" fill="url(#durga-gold)" />
        <path d="M154 122C175 71 194 46 210 46C226 46 245 71 266 122" fill="none" stroke="url(#durga-gold)" strokeWidth="12" strokeLinecap="round" />
        <path d="M130 138L151 109L162 145Z" fill="url(#durga-gold-deep)" />
        <path d="M290 138L269 109L258 145Z" fill="url(#durga-gold-deep)" />
        <circle cx="210" cy="70" r="12" fill="#fff4ba" />
        <circle cx="210" cy="92" r="7" fill="#ef4444" />
      </g>

      <g>
        <path d="M173 245C183 256 195 263 210 267C225 263 237 256 247 245" fill="none" stroke="url(#durga-gold)" strokeWidth="8" strokeLinecap="round" />
        <path d="M164 267C177 280 193 287 210 290C227 287 243 280 256 267" fill="none" stroke="url(#durga-gold)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="210" cy="278" r="13" fill="url(#durga-gold)" />
        <path d="M181 303H239" stroke="url(#durga-gold)" strokeWidth="8" strokeLinecap="round" />
      </g>

      <g>
        <path d="M160 282C149 261 135 248 120 246C105 244 92 251 80 266" fill="none" stroke="url(#durga-skin)" strokeWidth="16" strokeLinecap="round" />
        <circle cx="73" cy="272" r="18" fill="url(#durga-skin)" />
      </g>

      <motion.g
        initial={false}
        animate={blessingActive ? { rotate: -10, x: 2, y: -10 } : { rotate: 20, x: 42, y: 20 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '296px 246px' }}
      >
        <path d="M259 279C268 257 280 243 296 239C312 235 325 241 336 257" fill="none" stroke="url(#durga-skin)" strokeWidth="16" strokeLinecap="round" />
        <circle cx="343" cy="262" r="18" fill="url(#durga-skin)" />
        <path d="M338 247C345 252 348 261 347 270C337 272 329 268 323 260C327 252 332 248 338 247Z" fill="#fbe19d" opacity="0.88" />
      </motion.g>

      <motion.g
        initial={false}
        animate={phase === 'entry' ? { y: 8, rotate: -4 } : { y: -2, rotate: 3 }}
        transition={{ duration: 2.2, ease: 'easeInOut' }}
        style={{ transformOrigin: '210px 428px' }}
      >
        <path d="M116 437C148 421 179 413 210 413C241 413 272 421 304 437" fill="none" stroke="#f5c44c" strokeWidth="12" strokeLinecap="round" />
        <path d="M142 454C162 442 185 436 210 436C235 436 258 442 278 454" fill="none" stroke="#fff0ab" strokeWidth="10" strokeLinecap="round" />
      </motion.g>
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
      const compressor = context.createDynamicsCompressor();
      const highpass = context.createBiquadFilter();
      const lowpass = context.createBiquadFilter();
      const master = context.createGain();

      compressor.threshold.setValueAtTime(-22, time);
      compressor.knee.setValueAtTime(18, time);
      compressor.ratio.setValueAtTime(3, time);
      compressor.attack.setValueAtTime(0.003, time);
      compressor.release.setValueAtTime(0.18, time);

      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(170, time);
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(2400, time);
      lowpass.Q.setValueAtTime(0.8, time);

      master.gain.setValueAtTime(0.0001, time);
      master.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
      master.gain.exponentialRampToValueAtTime(0.12, time + 0.42);
      master.gain.exponentialRampToValueAtTime(0.0001, time + 4.8);

      master.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(compressor);
      compressor.connect(context.destination);

      const partials = [
        { frequency: 392, gain: 0.8, decay: 4.8, type: 'sine' as OscillatorType },
        { frequency: 587, gain: 0.46, decay: 4.1, type: 'triangle' as OscillatorType },
        { frequency: 783, gain: 0.28, decay: 3.4, type: 'sine' as OscillatorType },
        { frequency: 1174, gain: 0.16, decay: 2.7, type: 'triangle' as OscillatorType },
        { frequency: 1568, gain: 0.09, decay: 2.1, type: 'sine' as OscillatorType }
      ];

      partials.forEach((partial, index) => {
        const oscillator = context.createOscillator();
        const partialGain = context.createGain();

        oscillator.type = partial.type;
        oscillator.frequency.setValueAtTime(partial.frequency, time);
        oscillator.frequency.exponentialRampToValueAtTime(partial.frequency * 0.985, time + partial.decay);
        oscillator.detune.setValueAtTime(index % 2 === 0 ? -4 : 5, time);

        partialGain.gain.setValueAtTime(0.0001, time);
        partialGain.gain.exponentialRampToValueAtTime(partial.gain / 10, time + 0.015);
        partialGain.gain.exponentialRampToValueAtTime(0.0001, time + partial.decay);

        oscillator.connect(partialGain);
        partialGain.connect(master);

        oscillator.start(time + index * 0.008);
        oscillator.stop(time + partial.decay + 0.1);
      });

      const noiseBuffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * 0.14)), context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let index = 0; index < noiseData.length; index += 1) {
        noiseData[index] = (Math.random() * 2 - 1) * Math.exp(-index / (noiseData.length / 5));
      }

      const noise = context.createBufferSource();
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();

      noise.buffer = noiseBuffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2100, time);
      noiseFilter.Q.setValueAtTime(0.9, time);
      noiseGain.gain.setValueAtTime(0.08, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start(time);
      noise.stop(time + 0.18);
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
        chimeIntervalRef.current = window.setInterval(playChime, 3600);
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
                    className="relative w-full max-w-[330px] transform-gpu [transform-style:preserve-3d] sm:max-w-[390px] lg:max-w-[440px]"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.82 }}
                      animate={{ opacity: phase === 'exit' ? 0 : 1, scale: 1.02 }}
                      transition={{ duration: 1.6, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,248,196,0.52),_rgba(255,196,77,0.18)_44%,_transparent_72%)] blur-3xl"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                      animate={{ opacity: phase === 'exit' ? 0 : 0.9, scale: 1, rotate: 6 }}
                      transition={{ duration: 2.2, ease: 'easeOut' }}
                      className="absolute inset-[8%] rounded-full border border-[#ffe2a8]/20 bg-[radial-gradient(circle,_rgba(255,223,128,0.14),_rgba(255,223,128,0.03)_58%,_transparent_78%)] shadow-[0_0_90px_rgba(251,191,36,0.14)]"
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
