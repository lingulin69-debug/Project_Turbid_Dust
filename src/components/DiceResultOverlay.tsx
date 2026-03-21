import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DiceAnimData {
  dice_type: 'D6' | 'D20';
  result: number;
  message: string;
  coins_delta: number;
  status_tag: string;
}

export const DiceResultOverlay: React.FC<{ data: DiceAnimData; onClose: () => void }> = ({ data, onClose }) => {
  const [displayed, setDisplayed] = React.useState(1);
  const [settled, setSettled] = React.useState(false);
  const max = data.dice_type === 'D20' ? 20 : 6;

  useEffect(() => {
    let count = 0;
    const cycles = 24;
    const id = setInterval(() => {
      count++;
      if (count < cycles) {
        setDisplayed(Math.floor(Math.random() * max) + 1);
      } else {
        clearInterval(id);
        setDisplayed(data.result);
        setTimeout(() => setSettled(true), 60);
      }
    }, 72);
    return () => clearInterval(id);
  }, [data.result, data.dice_type, max]);

  return (
    <div
      className="absolute inset-0 z-[75] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(4,2,8,0.88)' }}
    >
      <div className="flex flex-col items-center gap-6 select-none">
        <p className="font-mono tracking-[0.5em] uppercase" style={{ fontSize: 9, color: '#5a4a30' }}>
          {data.dice_type} · 判定結果
        </p>
        <motion.div
          animate={settled ? { scale: [1, 1.22, 0.94, 1.06, 1] } : {}}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative flex items-center justify-center"
          style={{
            width: 128, height: 128,
            borderRadius: 20,
            backgroundColor: '#0d0618',
            border: `2px solid ${settled ? '#7c3aed' : '#2e1a50'}`,
            boxShadow: settled
              ? '0 0 48px 12px rgba(124,58,237,0.55), inset 0 0 24px rgba(124,58,237,0.12)'
              : '0 0 16px rgba(124,58,237,0.15)',
            transition: 'border-color 0.25s, box-shadow 0.25s',
          }}
        >
          <motion.span
            key={displayed}
            initial={{ opacity: 0.5, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.06 }}
            style={{
              fontSize: 64, lineHeight: 1,
              fontFamily: 'monospace',
              color: settled ? '#d4af37' : '#7b6aaa',
            }}
          >
            {displayed}
          </motion.span>
          <span style={{
            position: 'absolute', bottom: 7, right: 11,
            fontSize: 9, fontFamily: 'monospace',
            color: 'rgba(180,160,230,0.25)', letterSpacing: '0.15em',
          }}>
            {data.dice_type}
          </span>
        </motion.div>
        <AnimatePresence>
          {settled && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center gap-3 text-center"
              style={{ maxWidth: 280 }}
            >
              {data.message && (
                <p style={{ color: '#c5a8e0', fontSize: 13, fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8 }}>
                  {data.message}
                </p>
              )}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {data.coins_delta !== 0 && (
                  <span style={{
                    fontSize: 12, fontFamily: 'monospace',
                    color: data.coins_delta > 0 ? '#22c55e' : '#ef4444',
                    padding: '2px 10px', borderRadius: 4,
                    backgroundColor: data.coins_delta > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${data.coins_delta > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                    {data.coins_delta > 0 ? `+${data.coins_delta}` : data.coins_delta} 幣
                  </span>
                )}
                {data.status_tag && (
                  <span style={{
                    fontSize: 11, fontFamily: 'monospace',
                    color: '#c5a8e0', padding: '2px 10px', borderRadius: 4,
                    border: '1px solid rgba(124,58,237,0.35)',
                    backgroundColor: 'rgba(124,58,237,0.1)',
                  }}>
                    {data.status_tag}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  marginTop: 10, padding: '6px 28px',
                  fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.35em',
                  color: '#9b7fe8', border: '1px solid rgba(124,58,237,0.4)',
                  borderRadius: 4, backgroundColor: 'rgba(124,58,237,0.12)', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(124,58,237,0.22)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(124,58,237,0.12)'; }}
              >
                確認
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
