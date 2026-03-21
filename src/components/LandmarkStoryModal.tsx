import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { UserData } from './ReportSystemLogic';
import { LandmarkData } from './MapLandmark';

// Ideally, this would be in a shared types file
export interface Landmark extends LandmarkData {
  // Inherits from LandmarkData
}

interface LandmarkStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  landmarkId: string | null;
  landmarks: Landmark[];
  landmarkChapters: any;
  currentUser: UserData | null;
  playerFaction: 'Turbid' | 'Pure' | 'Common';
  pageTheme: any;
  onJoinParty: (landmarkId: string, requiredCount: number) => Promise<'success' | 'full' | 'already' | 'error'>;
}

export const LandmarkStoryModal: React.FC<LandmarkStoryModalProps> = ({
  isOpen,
  onClose,
  landmarkId,
  landmarks,
  landmarkChapters,
  currentUser,
  playerFaction,
  pageTheme,
  onJoinParty,
}) => {
  const [partyJoinLoading, setPartyJoinLoading] = useState(false);
  const [partyJoinResult, setPartyJoinResult] = useState<'success' | 'full' | 'already' | 'error' | null>(null);

  const landmark = landmarks.find(l => l.id === landmarkId);

  // Reset join status when modal opens for a new landmark
  useEffect(() => {
    setPartyJoinResult(null);
  }, [landmarkId]);

  if (!isOpen || !landmarkId || !landmark) return null;

  const chapterEntry = landmarkChapters
    .flatMap((ch: any) => ch.landmarks)
    .find((l: any) => l.id === landmarkId);

  const hasStory = chapterEntry && (
    chapterEntry.intro_text || chapterEntry.mission_text ||
    chapterEntry.teamup_text || chapterEntry.outro_text
  );

  const handleJoinClick = async () => {
    if (!currentUser || partyJoinLoading || !landmark) return;
    setPartyJoinLoading(true);
    setPartyJoinResult(null);
    try {
        const result = await onJoinParty(landmark.id, landmark.capacity ?? 2);
        setPartyJoinResult(result);
    } catch {
        setPartyJoinResult('error');
    } finally {
        setPartyJoinLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="landmark-modal"
          className="absolute inset-0 z-[65] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0)' }}
          initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        >
          <div className="relative mx-4 w-full max-w-[480px]" onClick={e => e.stopPropagation()}>
            <motion.div
              className="relative w-full rounded-lg border overflow-hidden"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
              style={{
                background: pageTheme.cardBg || (playerFaction === 'Turbid'
                  ? 'linear-gradient(160deg,#130826,#1f0d40,#110622)'
                  : 'linear-gradient(180deg,#f5f2ed,#ebe6dd)'),
                borderColor: pageTheme.primary,
                boxShadow: playerFaction === 'Turbid'
                  ? '0 24px 64px rgba(30,0,80,0.55)'
                  : '0 24px 64px rgba(100,90,75,0.18)',
                maxHeight: 'calc(100vh - 80px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${pageTheme.primary}, transparent)`, flexShrink: 0 }} />

              <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${pageTheme.border}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[9px] tracking-[0.4em] uppercase font-mono mb-1.5" style={{ color: pageTheme.textSecondary, opacity: 0.7 }}>
                      {landmark.faction === 'Turbid' ? '濁息據點' : '淨塵據點'}
                    </div>
                    <div className="text-[22px] font-bold leading-tight" style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif", letterSpacing: '0.12em' }}>
                      {landmark.name}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full hover:opacity-60 transition-opacity"
                    style={{ border: `1px solid ${pageTheme.border}`, color: pageTheme.textSecondary }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  {landmark.capacity != null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono" style={{ color: pageTheme.textSecondary, opacity: 0.6 }}>組隊人數</span>
                      <span className="text-[13px] font-mono font-bold px-2.5 py-0.5 rounded-md" style={{
                          color: (landmark.occupants ?? 0) >= landmark.capacity ? '#f87171' : '#4ade80',
                          backgroundColor: (landmark.occupants ?? 0) >= landmark.capacity ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                          border: `1px solid ${(landmark.occupants ?? 0) >= landmark.capacity ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.25)'}`,
                        }}>
                        {landmark.occupants ?? 0}/{landmark.capacity}
                      </span>
                    </div>
                  ) : <div />}

                  {currentUser && landmark.status === 'open' && currentUser.faction === landmark.faction ? (
                    partyJoinResult === 'success' ? (
                      <div className="text-[11px] font-mono px-3 py-1.5 rounded-md" style={{ color: playerFaction === 'Turbid' ? '#a78bfa' : '#b89f86', backgroundColor: playerFaction === 'Turbid' ? 'rgba(167,139,250,0.1)' : 'rgba(184,159,134,0.12)', border: `1px solid ${playerFaction === 'Turbid' ? 'rgba(167,139,250,0.25)' : 'rgba(184,159,134,0.25)'}` }}>
                        ✦ 已申請加入
                      </div>
                    ) : partyJoinResult === 'full' ? (
                      <div className="text-[11px] font-mono px-3 py-1.5 rounded-md" style={{ color: '#f87171', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                        ✕ 人數已滿
                      </div>
                    ) : partyJoinResult === 'already' ? (
                      <div className="text-[11px] font-mono px-3 py-1.5 rounded-md" style={{ color: pageTheme.textSecondary, backgroundColor: 'transparent', border: `1px solid ${pageTheme.border}` }}>
                        已在組隊中
                      </div>
                    ) : (
                      <button
                        disabled={partyJoinLoading}
                        onClick={handleJoinClick}
                        className="text-[12px] font-mono tracking-[0.1em] px-4 py-1.5 rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{
                          backgroundColor: playerFaction === 'Turbid' ? 'rgba(124,58,237,0.2)' : 'rgba(184,159,134,0.2)',
                          border: `1px solid ${pageTheme.primary}`,
                          color: pageTheme.textPrimary,
                        }}
                      >
                        {partyJoinLoading ? '申請中...' : '加入組隊'}
                      </button>
                    )
                  ) : landmark.status === 'open' && !currentUser ? (
                    <div className="text-[11px] font-mono" style={{ color: pageTheme.textSecondary, opacity: 0.5 }}>請先登入</div>
                  ) : null}
                </div>
                {partyJoinResult === 'error' && (
                  <div className="text-[11px] font-mono mt-1.5 text-right" style={{ color: '#f87171' }}>申請失敗，請稍後再試</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {!hasStory ? (
                  <div className="text-center py-10">
                    <div className="text-sm italic" style={{ color: pageTheme.textSecondary }}>此據點尚無劇情記錄。</div>
                    <div className="text-[10px] tracking-[0.3em] font-mono mt-2" style={{ color: pageTheme.textSecondary, opacity: 0.4 }}>[ STORY DATA PENDING ]</div>
                  </div>
                ) : (
                  <>
                    {chapterEntry.intro_text && (
                      <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-0.5 h-[18px] rounded-full flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                          <span className="text-[16px] font-bold tracking-[0.06em]" style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>據點描述</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3" style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                          {chapterEntry.intro_text}
                        </p>
                      </div>
                    )}
                    {chapterEntry.mission_text && (
                       <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-0.5 h-[18px] rounded-full flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                          <span className="text-[16px] font-bold tracking-[0.06em]" style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>任務內容</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3" style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                          {chapterEntry.mission_text}
                        </p>
                      </div>
                    )}
                    {(chapterEntry.teamup_text || chapterEntry.npc_text) && (
                      <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-0.5 h-[18px] rounded-full flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                          <span className="text-[16px] font-bold tracking-[0.06em]" style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>組隊內容</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        {chapterEntry.teamup_text && (
                          <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3" style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                            {chapterEntry.teamup_text}
                          </p>
                        )}
                        {chapterEntry.npc_text && (
                          <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3 mt-3" style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                            {chapterEntry.npc_text}
                          </p>
                        )}
                      </div>
                    )}
                    {chapterEntry.outro_text && (
                       <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-0.5 h-[18px] rounded-full flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                          <span className="text-[16px] font-bold tracking-[0.06em]" style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>結局</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3" style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                          {chapterEntry.outro_text}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 py-2 border-t flex justify-between text-[9px] tracking-widest font-mono flex-shrink-0" style={{ borderColor: pageTheme.border, color: pageTheme.textSecondary, opacity: 0.4 }}>
                <span>{chapterEntry?.chapter_unlock ? `Ch ${chapterEntry.chapter_unlock}` : 'Ch 1.0'}</span>
                <span>{landmark.status === 'open' ? 'OPEN' : 'CLOSED'}</span>
              </div>
            </motion.div>
            <motion.div
              className="hidden sm:block absolute bottom-0 left-full pl-2 pointer-events-none"
              style={{ width: 560, height: 800 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <img
                src={`/assets/portraits/landmark_${landmark.id}.png`}
                alt=""
                onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/portraits/portrait_unknown.png'; }}
                className="w-full h-full object-cover object-top select-none"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
