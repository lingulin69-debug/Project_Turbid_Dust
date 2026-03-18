import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/client';

// ── 型別 ─────────────────────────────────────────────────────────────────────
interface SettlementResult {
  chapter_version: string;
  final_balance_value: number;
  winning_faction: 'Turbid' | 'Pure' | 'Draw';
  lottie_animation_data: object | null;
}

interface BalanceSettlementModalProps {
  chapterVersion?: string;
  onClose: () => void;
}

// ── 靜態天平 SVG 組件（Lottie 插槽） ─────────────────────────────────────────
// 當 lottie_animation_data 有值時，替換此組件為 <LottiePlayer data={...} />
const StaticBalanceScale: React.FC<{
  balanceValue: number;
  winningFaction: 'Turbid' | 'Pure' | 'Draw';
  animating: boolean;
}> = ({ balanceValue, winningFaction, animating }) => {
  // 0 → -22deg (Turbid 重，左傾)，50 → 0deg，100 → +22deg (Pure 重，右傾)
  const targetRotation = animating ? (balanceValue - 50) * 0.44 : 0;
  const turbidGlow = winningFaction === 'Turbid';
  const pureGlow   = winningFaction === 'Pure';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 160 }}>
      {/* 底座立柱 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 rounded-t-sm"
        style={{ height: 72, backgroundColor: '#4a3f2f' }} />
      {/* 底座橫板 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2 rounded"
        style={{ width: 64, backgroundColor: '#3a3028' }} />

      {/* 橫樑 + 秤盤（整體旋轉） */}
      <motion.div
        className="absolute"
        style={{ top: 24, left: 0, right: 0, transformOrigin: '50% 50%' }}
        animate={{ rotate: targetRotation }}
        transition={{ type: 'spring', stiffness: 28, damping: 9, delay: animating ? 0.4 : 0 }}
      >
        {/* 橫樑 */}
        <div className="relative mx-auto h-1.5 rounded-full"
          style={{ width: 240, background: 'linear-gradient(90deg, #6b5a3e, #c9a84c, #6b5a3e)' }}>
          {/* 支點 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2"
            style={{ backgroundColor: '#c9a84c', borderColor: '#8a6f30' }} />
        </div>

        {/* 左秤盤：濁息（Turbid） */}
        <div className="absolute flex flex-col items-center" style={{ left: 0, top: 6 }}>
          {/* 吊鍊 */}
          <div className="w-px" style={{ height: 28, backgroundColor: turbidGlow ? '#9b7fe8' : '#5a5060' }} />
          {/* 秤盤 */}
          <motion.div
            className="rounded-b-full border-t-0 flex items-center justify-center"
            style={{
              width: 52, height: 18,
              backgroundColor: turbidGlow ? '#3b1f6a' : '#1e1828',
              borderWidth: 1,
              borderColor: turbidGlow ? '#7c3aed' : '#3a3048',
              boxShadow: turbidGlow ? '0 0 18px 4px #7c3aed60' : 'none',
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="mt-1.5 font-mono tracking-[0.3em] uppercase"
            style={{ fontSize: 9, color: turbidGlow ? '#9b7fe8' : '#5a5060' }}>
            濁息
          </span>
        </div>

        {/* 右秤盤：淨塵（Pure） */}
        <div className="absolute flex flex-col items-center" style={{ right: 0, top: 6 }}>
          <div className="w-px" style={{ height: 28, backgroundColor: pureGlow ? '#d4af37' : '#6a6050' }} />
          <motion.div
            className="rounded-b-full border-t-0 flex items-center justify-center"
            style={{
              width: 52, height: 18,
              backgroundColor: pureGlow ? '#3a3010' : '#1e1c10',
              borderWidth: 1,
              borderColor: pureGlow ? '#d4af37' : '#4a4030',
              boxShadow: pureGlow ? '0 0 18px 4px #d4af3760' : 'none',
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
          <span className="mt-1.5 font-mono tracking-[0.3em] uppercase"
            style={{ fontSize: 9, color: pureGlow ? '#d4af37' : '#6a6050' }}>
            淨塵
          </span>
        </div>
      </motion.div>
    </div>
  );
};

// ── 主組件 ────────────────────────────────────────────────────────────────────
export const BalanceSettlementModal: React.FC<BalanceSettlementModalProps> = ({
  chapterVersion,
  onClose,
}) => {
  const [phase, setPhase] = useState<'loading' | 'appear' | 'tilt' | 'reveal' | 'error'>('loading');
  const [result, setResult] = useState<SettlementResult | null>(null);

  // 依序推進三個演出階段
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    const load = async () => {
      try {
        const data = await apiClient.settlement.getResult(chapterVersion);
        setResult(data);
        setPhase('appear');
        t1 = setTimeout(() => setPhase('tilt'),   1200);
        t2 = setTimeout(() => setPhase('reveal'),  3200);
      } catch (_) {
        setPhase('error');
      }
    };

    load();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [chapterVersion]);

  const factionLabel = result
    ? result.winning_faction === 'Turbid' ? '濁息者勝出'
    : result.winning_faction === 'Pure'   ? '淨塵者勝出'
    : '天平平衡'
    : '';

  const factionColor = result?.winning_faction === 'Turbid' ? '#9b7fe8'
    : result?.winning_faction === 'Pure' ? '#d4af37'
    : '#a09070';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(4,2,8,0.92)', backdropFilter: 'blur(4px)' }}
    >
      <AnimatePresence mode="wait">

        {/* ── 載入中 ── */}
        {phase === 'loading' && (
          <motion.p
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="font-mono text-sm tracking-[0.3em] animate-pulse"
            style={{ color: '#6a5a40' }}
          >
            正在讀取結算資料...
          </motion.p>
        )}

        {/* ── 錯誤 ── */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <p className="font-mono text-sm tracking-widest" style={{ color: '#8a6040' }}>
              結算資料暫不可用
            </p>
            <button
              onClick={onClose}
              className="font-mono text-xs tracking-[0.3em] hover:opacity-60 transition-opacity"
              style={{ color: '#6a5040' }}
            >
              [ 關閉 ]
            </button>
          </motion.div>
        )}

        {/* ── 主演出畫面 ── */}
        {(phase === 'appear' || phase === 'tilt' || phase === 'reveal') && result && (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center gap-8 select-none"
            style={{ pointerEvents: 'none' }}
          >
            {/* 章節標記 */}
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-mono tracking-[0.5em] uppercase"
              style={{ fontSize: 10, color: '#5a4a30' }}
            >
              {result.chapter_version} · 陣營結算
            </motion.p>

            {/* ── Lottie 插槽 ──────────────────────────────────────────────
                素材到位後，將此區塊替換為：
                <LottiePlayer data={result.lottie_animation_data} loop={false} />
                ─────────────────────────────────────────────────────────── */}
            <StaticBalanceScale
              balanceValue={result.final_balance_value}
              winningFaction={result.winning_faction}
              animating={phase === 'tilt' || phase === 'reveal'}
            />

            {/* 結果文字（phase: reveal 才顯示） */}
            <AnimatePresence>
              {phase === 'reveal' && (
                <motion.div
                  key="result-text"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* 裝飾線 */}
                  <div className="flex items-center gap-3">
                    <div className="h-px w-16" style={{ backgroundColor: `${factionColor}40` }} />
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: `${factionColor}80` }} />
                    <div className="h-px w-16" style={{ backgroundColor: `${factionColor}40` }} />
                  </div>

                  {/* 獲勝陣營 */}
                  <p className="font-mono tracking-[0.4em]"
                    style={{ fontSize: 18, color: factionColor, letterSpacing: '0.4em' }}>
                    {factionLabel}
                  </p>

                  {/* 天平數值 */}
                  <p className="font-mono tracking-[0.25em]"
                    style={{ fontSize: 12, color: `${factionColor}90` }}>
                    最終天平值 {result.final_balance_value.toFixed(1)}
                  </p>

                  {/* 確認按鈕 */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    onClick={onClose}
                    style={{
                      pointerEvents: 'auto',
                      marginTop: 12,
                      padding: '6px 28px',
                      fontFamily: 'monospace',
                      fontSize: 11,
                      letterSpacing: '0.35em',
                      color: factionColor,
                      border: `1px solid ${factionColor}50`,
                      borderRadius: 4,
                      backgroundColor: `${factionColor}12`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${factionColor}28`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${factionColor}12`; }}
                  >
                    確認存檔
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
