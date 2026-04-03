import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreathingScene {
  transition: string;
  title: string;
  faction: string;
  text: string;
  duration_seconds: number;
  special?: boolean;
}

interface BreathingSceneModalProps {
  isOpen: boolean;
  scene: BreathingScene | null;
  playerFaction: 'Turbid' | 'Pure' | 'Common';
  onComplete: () => void;
}

export const BreathingSceneModal: React.FC<BreathingSceneModalProps> = ({
  isOpen,
  scene,
  playerFaction,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const duration = (scene?.duration_seconds ?? 30) * 1000;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !scene) return;
    setProgress(0);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        timerRef.current = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };
    timerRef.current = requestAnimationFrame(tick);

    return cleanup;
  }, [isOpen, scene, duration, onComplete, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (!scene) return null;

  const isTurbid = playerFaction === 'Turbid';
  const isSpecial = scene.special === true;

  const bgGradient = isSpecial
    ? 'linear-gradient(180deg, #0a0a0a, #111111, #0a0a0a)'
    : isTurbid
      ? 'linear-gradient(180deg, #0d0818, #130a22, #0d0818)'
      : 'linear-gradient(180deg, #f5f2ed, #ebe6dd, #f5f2ed)';

  const textColor = isSpecial
    ? '#888888'
    : isTurbid ? 'rgba(255,255,255,0.82)' : 'rgba(40,30,20,0.82)';

  const titleColor = isSpecial
    ? '#555555'
    : isTurbid ? 'rgba(167,139,250,0.6)' : 'rgba(160,130,80,0.6)';

  const progressBarColor = isSpecial
    ? '#444444'
    : isTurbid ? '#7c3aed' : '#d4af37';

  const paragraphs = scene.text.split('\n').filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="breathing-scene"
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: bgGradient, cursor: 'pointer' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          onClick={onComplete}
        >
          <div className="relative max-w-[640px] w-full px-8 py-12" onClick={e => e.stopPropagation()}>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <span
                className="text-[10px] tracking-[0.6em] uppercase font-mono"
                style={{ color: titleColor }}
              >
                {scene.title}
              </span>
            </motion.div>

            <div className="space-y-6">
              {paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  className="text-[15px] leading-[2.4] text-center"
                  style={{
                    color: textColor,
                    fontFamily: "'Noto Serif TC', serif",
                    letterSpacing: '0.08em',
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.0 + i * 0.8,
                    duration: 1.2,
                    ease: 'easeOut',
                  }}
                >
                  {p}
                </motion.p>
              ))}
            </div>

            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 2.5, duration: 1 }}
            >
              <span
                className="text-[10px] tracking-[0.4em] font-mono"
                style={{ color: textColor }}
              >
                點擊任意處跳過
              </span>
            </motion.div>

            <div
              className="absolute bottom-4 left-8 right-8 h-[2px] rounded-full overflow-hidden"
              style={{ backgroundColor: `${progressBarColor}15` }}
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: progressBarColor,
                  opacity: 0.5,
                }}
              />
            </div>
          </div>

          <button
            className="absolute top-6 right-6 text-[10px] tracking-[0.3em] font-mono px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
            style={{
              color: textColor,
              border: `1px solid ${progressBarColor}30`,
              backgroundColor: 'transparent',
              opacity: 0.4,
            }}
            onClick={onComplete}
          >
            跳過 ›
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
