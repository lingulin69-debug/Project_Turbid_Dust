import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChapterOpening {
  chapter_version: string;
  faction: string;
  title: string;
  opening_text: string;
  background_image: string | null;
}

interface ChapterOpeningModalProps {
  isOpen: boolean;
  opening: ChapterOpening | null;
  playerFaction: 'Turbid' | 'Pure' | 'Common';
  onContinue: () => void;
}

export const ChapterOpeningModal: React.FC<ChapterOpeningModalProps> = ({
  isOpen,
  opening,
  playerFaction,
  onContinue,
}) => {
  if (!opening) return null;

  const isTurbid = playerFaction === 'Turbid';

  const bgGradient = isTurbid
    ? 'linear-gradient(180deg, #0d0818, #1a0f2e, #0d0818)'
    : 'linear-gradient(180deg, #f0ece4, #e8e0d4, #f0ece4)';

  const textColor = isTurbid ? 'rgba(255,255,255,0.9)' : 'rgba(40,30,20,0.9)';
  const subtitleColor = isTurbid ? 'rgba(167,139,250,0.5)' : 'rgba(160,130,80,0.5)';
  const accentColor = isTurbid ? '#7c3aed' : '#d4af37';
  const chapterNum = opening.chapter_version.replace('.0', '');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chapter-opening"
          className="fixed inset-0 z-[190] flex items-center justify-center"
          style={{ background: bgGradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {opening.background_image && (
            <img
              src={opening.background_image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.15 }}
            />
          )}

          <div className="relative z-10 max-w-[560px] w-full px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              <div
                className="text-[10px] tracking-[1em] uppercase font-mono mb-6"
                style={{ color: subtitleColor }}
              >
                Chapter {chapterNum}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
            >
              <h1
                className="text-[28px] sm:text-[36px] font-bold tracking-[0.15em] leading-tight"
                style={{
                  color: textColor,
                  fontFamily: "'Noto Serif TC', serif",
                }}
              >
                {opening.title}
              </h1>
            </motion.div>

            <motion.div
              className="mt-4 mx-auto"
              style={{ width: 60, height: 1, backgroundColor: accentColor, opacity: 0.4 }}
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            />

            {opening.opening_text && !opening.opening_text.startsWith('[') && (
              <motion.p
                className="mt-8 text-[14px] leading-[2.2]"
                style={{
                  color: textColor,
                  fontFamily: "'Noto Serif TC', serif",
                  letterSpacing: '0.06em',
                  opacity: 0.75,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.75, y: 0 }}
                transition={{ delay: 1.4, duration: 1 }}
              >
                {opening.opening_text}
              </motion.p>
            )}

            <motion.button
              className="mt-12 text-[12px] tracking-[0.3em] font-mono px-8 py-2.5 rounded-md transition-opacity hover:opacity-80"
              style={{
                color: textColor,
                border: `1px solid ${accentColor}50`,
                backgroundColor: `${accentColor}10`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.6 }}
              onClick={onContinue}
            >
              進入章節 ›
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
