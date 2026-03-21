import React, { useState, useEffect } from 'react';
import { FACTION_COLORS } from '@/lib/constants';

export interface KidnapPopupProps {
  notification: { id: string; content: string };
  lostUntil: string | null;
  onMarkRead: () => void;
  onOpenCharacterCard: () => void;
}

export const KidnapPopup: React.FC<KidnapPopupProps> = ({
  notification, lostUntil, onMarkRead, onOpenCharacterCard,
}) => {
  const [remaining, setRemaining] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!lostUntil) return;
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(lostUntil).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0) {
        onMarkRead();
        setDismissed(true);
      }
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [lostUntil, onMarkRead]);

  if (dismissed) return null;

  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;
  const timeStr = remaining > 0
    ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : '黑霧散去了...';

  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Atmospheric noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")',
          backgroundSize: '150px',
        }}
      />
      <div className="relative max-w-sm w-full mx-6 text-center space-y-6 font-mono">
        {/* Title */}
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.5em] uppercase text-gray-600">[ TERMINAL RESTRICTED ]</p>
          <p className="text-red-500/80 text-[11px] tracking-[0.3em] uppercase animate-pulse">⚠ 觀測者信號中斷</p>
        </div>

        {/* Content */}
        <div
          className="px-5 py-4 rounded border text-sm text-gray-300 leading-relaxed text-left"
          style={{ backgroundColor: '#0f0a0a', borderColor: `${FACTION_COLORS.leaderEvil}50` }}
        >
          {notification.content}
        </div>

        {/* Countdown */}
        <div className="space-y-1">
          <p className="text-[10px] text-gray-700 tracking-widest">預計恢復時間</p>
          <p
            className="text-3xl tracking-[0.3em]"
            style={{ color: remaining > 0 ? '#ef4444' : '#6b7280' }}
          >
            {timeStr}
          </p>
        </div>

        {/* Limited actions */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={onOpenCharacterCard}
            className="text-[11px] text-gray-600 hover:text-gray-400 tracking-widest transition-colors border border-gray-800 px-4 py-2 rounded"
          >
            查看角色卡
          </button>
        </div>

        <p className="text-[10px] text-gray-800 tracking-[0.3em]">其餘終端功能暫時停用</p>
      </div>
    </div>
  );
};
