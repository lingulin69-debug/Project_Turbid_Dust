import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface MajorChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterVersion: string;
  chapterTitle: string;
  narrativeText: string;
  playerFaction: 'Turbid' | 'Pure' | 'Common';
}

export const MajorChapterModal: React.FC<MajorChapterModalProps> = ({
  isOpen,
  onClose,
  chapterTitle,
  narrativeText,
  playerFaction,
}) => {
  const [scrolled, setScrolled] = useState(false);

  const isTurbid = playerFaction === 'Turbid';

  const bgGradient = isTurbid
    ? 'linear-gradient(160deg, #130826, #1f0d40, #110622)'
    : 'linear-gradient(180deg, #f5f2ed, #ebe6dd)';
  const borderColor = isTurbid ? '#7c3aed' : '#d4af37';
  const textColor = isTurbid ? 'rgba(255,255,255,0.85)' : 'rgba(40,30,20,0.85)';
  const textSecondary = isTurbid ? 'rgba(255,255,255,0.4)' : 'rgba(40,30,20,0.4)';
  const shadow = isTurbid
    ? '0 24px 64px rgba(30,0,80,0.55)'
    : '0 24px 64px rgba(100,90,75,0.18)';

  const paragraphs = narrativeText.split('\n').filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="major-chapter-modal"
          className="fixed inset-0 z-[180] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0)' }}
          initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <div
            className="relative mx-4 w-full max-w-[640px]"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              className="relative w-full rounded-lg border overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
              style={{
                background: bgGradient,
                borderColor,
                boxShadow: shadow,
                maxHeight: 'calc(100vh - 60px)',
              }}
            >
              <div
                className="h-[1px] flex-shrink-0"
                style={{ background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)` }}
              />

              <div
                className="px-6 pt-5 pb-4 flex-shrink-0 flex items-start justify-between gap-3"
                style={{ borderBottom: `1px solid ${borderColor}30` }}
              >
                <div className="min-w-0">
                  <div
                    className="text-[9px] tracking-[0.5em] uppercase font-mono mb-1.5"
                    style={{ color: textSecondary }}
                  >
                    大章節敘事
                  </div>
                  <div
                    className="text-[22px] font-bold leading-tight tracking-[0.1em]"
                    style={{ color: textColor, fontFamily: "'Noto Serif TC', serif" }}
                  >
                    {chapterTitle}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full hover:opacity-60 transition-opacity"
                  style={{ border: `1px solid ${borderColor}40`, color: textSecondary }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="flex-1 overflow-y-auto px-6 py-8 space-y-5"
                onScroll={e => {
                  const el = e.currentTarget;
                  setScrolled(el.scrollTop > 40);
                }}
                style={{ fontFamily: "'Noto Serif TC', serif" }}
              >
                {paragraphs.map((p, i) => {
                  if (p.startsWith('---')) {
                    return (
                      <div
                        key={i}
                        className="my-8 mx-auto"
                        style={{ width: 40, height: 1, backgroundColor: borderColor, opacity: 0.25 }}
                      />
                    );
                  }
                  const isDialogue = p.startsWith('「') || p.startsWith('『') || p.startsWith('"');
                  return (
                    <p
                      key={i}
                      className="text-[14px] leading-[2.3] whitespace-pre-wrap"
                      style={{
                        color: textColor,
                        letterSpacing: '0.05em',
                        paddingLeft: isDialogue ? '1.2em' : '0',
                        fontStyle: p.startsWith('*') ? 'italic' : 'normal',
                      }}
                    >
                      {p}
                    </p>
                  );
                })}
              </div>

              <div
                className="px-6 py-2.5 border-t flex items-center justify-between flex-shrink-0"
                style={{ borderColor: `${borderColor}25` }}
              >
                <span
                  className="text-[9px] tracking-[0.4em] font-mono"
                  style={{ color: textSecondary }}
                >
                  {scrolled ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
                  {' '}滾動閱讀
                </span>
                <button
                  onClick={onClose}
                  className="text-[11px] tracking-[0.2em] font-mono px-4 py-1.5 rounded-md transition-opacity hover:opacity-80"
                  style={{
                    color: textColor,
                    border: `1px solid ${borderColor}40`,
                    backgroundColor: `${borderColor}10`,
                  }}
                >
                  關閉
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
