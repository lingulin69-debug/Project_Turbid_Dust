import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import farewellMessages from '@/data/pet-farewell-messages.json';
import karmaTagsData from '@/data/karma-tags.json';
import itemsData from '@/components/items.json';
import { FACTION_COLORS } from '@/lib/constants';
import { apiClient } from '@/api/client';

/**
 * 白鴉之繭風格角色卡
 * - 直立式卡片 (3:4 比例)
 * - 米黃紙質感
 * - 東方神秘風格裝飾
 */

type KarmaTagEntry = { tag: string; description: string };

const karmaEntries: KarmaTagEntry[] = [
  ...((karmaTagsData as { behavior_tags: KarmaTagEntry[]; party_tags: KarmaTagEntry[] }).behavior_tags || []),
  ...((karmaTagsData as { behavior_tags: KarmaTagEntry[]; party_tags: KarmaTagEntry[] }).party_tags || []),
];

const KARMA_DESC: Record<string, string> = Object.fromEntries(
  karmaEntries.map(k => [k.tag, k.description])
);

interface RelicMeta {
  id: string;
  name: string;
  series: string;
  description: string;
  lore?: string;
  image_url?: string;
}
const RELIC_CATALOG: Record<string, RelicMeta> = Object.fromEntries(
  ((itemsData as any).relics as RelicMeta[] || []).map((r) => [r.id, r])
);

interface AlbumSeries {
  name: string;
  required_count: number;
  reward_name: string;
}
const ALBUM_LOGIC: Record<string, AlbumSeries> = Object.fromEntries(
  Object.entries((itemsData as any).album_logic || {}).map(([, v]: [string, any]) => [v.name, v])
);

const WARMTH_POEM_LINES = [
  '當光芒垂落於白鴉之翼，',
  '繩索斷裂在無聲的嘆息。',
  '',
  '你在繭中數著萬年的孤寂，',
  '我在霧中找尋破碎的蹤跡。',
  '',
  '那年祭典的蜜糖香氣，',
  '那截未被鬆開的細繩，',
  '',
  '都成了繭壁上抓痕的見證——',
  '最初的告別，從未真正結束。',
];

// ═══════════════════════════════════════════════════════════════════════════
// 白鴉主題配色
// ═══════════════════════════════════════════════════════════════════════════

const LIGHT_THEME = {
  primary: '#b89f86',
  secondary: '#8b7355',
  factionGold: '#d4af37',
  bgGradient: 'linear-gradient(135deg, #f0ebe5 0%, #e2ddd5 100%)',
  cardBg: 'linear-gradient(180deg, #f5f2ed 0%, #ebe6dd 100%)',
  border: 'rgba(184, 159, 134, 0.3)',
  textPrimary: '#5a4e44',
  textSecondary: '#8b7355',
  textMuted: 'rgba(139, 115, 85, 0.6)',
  itemBg: 'rgba(255,255,255,0.3)',
  fadedBg: 'rgba(184,159,134,0.2)',
  cardShadow: '0 20px 60px rgba(100, 90, 75, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
};

const TURBID_THEME = {
  primary: '#9b59b6',
  secondary: '#c5a8e0',
  factionGold: '#d4af37',
  bgGradient: 'linear-gradient(135deg, #1a0a2e 0%, #130826 100%)',
  cardBg: 'linear-gradient(180deg, #1e0f35 0%, #130826 100%)',
  border: 'rgba(124, 58, 237, 0.3)',
  textPrimary: '#e4d5f5',
  textSecondary: '#c5a8e0',
  textMuted: 'rgba(197, 168, 224, 0.6)',
  itemBg: 'rgba(155, 89, 182, 0.12)',
  fadedBg: 'rgba(124, 58, 237, 0.15)',
  cardShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(155, 89, 182, 0.15)',
};

// ═══════════════════════════════════════════════════════════════════════════
// 白羽粒子效果
// ═══════════════════════════════════════════════════════════════════════════

const FeatherParticles: React.FC = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    rotStart: `${-30 + Math.random() * 60}deg`,
    rotEnd: `${-60 + Math.random() * 120}deg`,
    drift: `${-40 + Math.random() * 80}px`,
    dur: `${4 + Math.random() * 5}s`,
    delay: `${Math.random() * 3}s`,
    scale: 0.6 + Math.random() * 0.8,
  }));

  return (
    <>
      <style>{`
        .feather-particle {
          position: absolute;
          top: -20px;
          width: 8px;
          height: 8px;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: feather-fall var(--fall-dur) var(--fall-delay) infinite ease-in;
        }

        @keyframes feather-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(var(--rot-start));
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) translateX(var(--drift)) rotate(var(--rot-end));
            opacity: 0;
          }
        }
      `}</style>
      {particles.map(p => (
        <span
          key={p.id}
          className="feather-particle"
          style={{
            left: p.left,
            '--rot-start': p.rotStart,
            '--rot-end': p.rotEnd,
            '--drift': p.drift,
            '--fall-dur': p.dur,
            '--fall-delay': p.delay,
            transform: `scale(${p.scale})`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 集齊詩歌 Modal
// ═══════════════════════════════════════════════════════════════════════════

const RelicPoemModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let lineIdx = 0;

    const showNext = () => {
      if (lineIdx >= WARMTH_POEM_LINES.length) return;
      setVisibleLines(prev => [...prev, lineIdx]);
      lineIdx++;
      timer = setTimeout(showNext, WARMTH_POEM_LINES[lineIdx - 1] === '' ? 400 : 1100);
    };

    timer = setTimeout(showNext, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setFadingOut(true);
    setTimeout(onClose, 1500);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[80] flex flex-col items-center justify-center ${fadingOut ? 'opacity-0' : 'opacity-100'} transition-opacity duration-1000`}
      style={{ backgroundColor: '#06040a', cursor: 'pointer' }}
      onClick={handleClose}
    >
      <FeatherParticles />

      <div className="relative z-10 text-center space-y-10 px-8 max-w-sm">
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.5em] uppercase font-mono"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            昔日的餘溫 · 全蒐集解鎖
          </p>
          <p className="text-base tracking-[0.3em] font-mono"
            style={{ color: 'rgba(255,255,255,0.75)' }}>
            雙生子:最初的告別
          </p>
        </div>

        <div className="space-y-1 text-left">
          {WARMTH_POEM_LINES.map((line, i) => (
            <p
              key={i}
              className="text-sm leading-loose font-mono transition-opacity duration-1000"
              style={{
                color: line === '' ? 'transparent' : 'rgba(255,255,255,0.82)',
                opacity: visibleLines.includes(i) ? 1 : 0,
                letterSpacing: '0.05em',
              }}
            >
              {line || '\u00A0'}
            </p>
          ))}
        </div>

        {visibleLines.length >= WARMTH_POEM_LINES.length && (
          <p className="text-[10px] tracking-[0.4em] font-mono animate-pulse"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            點擊任意處關閉
          </p>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 介面定義
// ═══════════════════════════════════════════════════════════════════════════

interface KarmaTag {
  tag: string;
  is_faded: boolean;
  description?: string;
  faded_at?: string;
}

interface StatusTag {
  tag: string;
  expires_chapter: string;
}

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_description: string;
  personality: string | null;
  habit: string | null;
}

interface Relic {
  relic_id: string;
  name: string;
  description: string;
  image_url: string | null;
}

interface WitnessRecord {
  landmark_name: string;
  members: string[];
  chapter_version: string;
}

interface TargetUserData {
  oc_name: string;
  faction: 'Turbid' | 'Pure';
  alias_name: string | null;
  cursed_name_prefix: string | null;
  karma_tags: KarmaTag[];
  status_tags: StatusTag[];
  current_outfit: string | null;
  wardrobe: string[];
  current_hp: number;
  max_hp: number;
  coins: number;
}

interface CharacterCardProps {
  targetOcName: string;
  viewerFaction: 'Turbid' | 'Pure';
  currentUserOcName: string;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// 主要組件
// ═══════════════════════════════════════════════════════════════════════════

export const CharacterCard: React.FC<CharacterCardProps> = ({
  targetOcName,
  viewerFaction,
  currentUserOcName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<TargetUserData | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [relics, setRelics] = useState<Relic[]>([]);
  const [showPoem, setShowPoem] = useState(false);
  const poemTriggered = useRef(false);
  const [witnessRecords, setWitnessRecords] = useState<WitnessRecord[]>([]);
  const [expandedPet, setExpandedPet] = useState<string | null>(null);
  const [expandedRelic, setExpandedRelic] = useState<string | null>(null);
  const [releasingPet, setReleasingPet] = useState<string | null>(null);
  const [farewellModal, setFarewellModal] = useState<{ petId: string; petName: string; message: string } | null>(null);
  const [activeKarmaTooltip, setActiveKarmaTooltip] = useState<string | null>(null);
  const [activeFadedTooltip, setActiveFadedTooltip] = useState<string | null>(null);
  const [fadedMarksFromApi, setFadedMarksFromApi] = useState<{ tag_id: string; name: string; description: string; timestamp: string }[]>([]);
  const [showFadedSection, setShowFadedSection] = useState(false);
  const [selectingOutfit, setSelectingOutfit] = useState(false);
  const [activeSection, setActiveSection] = useState<'info' | 'pets' | 'relics' | 'witness'>('info');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: user } = await (supabase as any)
          .from('td_users')
          .select('oc_name, faction, alias_name, cursed_name_prefix, karma_tags, status_tags, current_outfit, wardrobe, current_hp, max_hp, coins')
          .eq('oc_name', targetOcName)
          .maybeSingle();

        if (!user) return;

        setUserData({
          oc_name: user.oc_name,
          faction: user.faction as 'Turbid' | 'Pure',
          alias_name: user.alias_name ?? null,
          cursed_name_prefix: user.cursed_name_prefix ?? null,
          karma_tags: (user.karma_tags as any[]) || [],
          status_tags: (user.status_tags as any[]) || [],
          current_outfit: user.current_outfit ?? null,
          wardrobe: (user.wardrobe as string[]) || [],
          current_hp: user.current_hp ?? 10,
          max_hp: user.max_hp ?? 10,
          coins: user.coins || 0,
        });

        if ((user.faction as string) === viewerFaction) {
          const { data: petsData } = await (supabase as any)
            .from('player_pets')
            .select('pet_id, personality, habit, pets(name, description)')
            .eq('owner_oc', targetOcName)
            .eq('is_released', false);

          if (petsData) {
            setPets(petsData.map((p: any) => ({
              pet_id: p.pet_id,
              pet_name: p.pets?.name || p.pet_id,
              pet_description: p.pets?.description || '',
              personality: p.personality ?? null,
              habit: p.habit ?? null,
            })));
          }

          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          try {
            const relicsData = await apiClient.relics.get(targetOcName);
            const fetchedRelics: Relic[] = relicsData.relics || [];
            setRelics(fetchedRelics);

            if (!poemTriggered.current) {
              const warmthSeries = ALBUM_LOGIC['昔日的餘溫'];
              if (warmthSeries) {
                const warmthCount = fetchedRelics.filter(r => {
                  const meta = RELIC_CATALOG[r.relic_id];
                  return meta?.series === '昔日的餘溫';
                }).length;
                if (warmthCount >= warmthSeries.required_count) {
                  poemTriggered.current = true;
                  setTimeout(() => setShowPoem(true), 600);
                }
              }
            }
          } catch (_) {}

          const fadedRes = await fetch(`${apiBase}/user/faded-marks/${encodeURIComponent(targetOcName)}`);
          if (fadedRes.ok) {
            const fadedData = await fadedRes.json();
            setFadedMarksFromApi(fadedData.faded_marks || []);
          }

          const { data: witnessData } = await (supabase as any)
            .from('party_event_logs')
            .select('landmark_name, members, chapter_version')
            .contains('members', JSON.stringify([targetOcName]))
            .order('created_at', { ascending: false })
            .limit(10);

          if (witnessData) {
            setWitnessRecords(witnessData.map((w: any) => ({
              landmark_name: w.landmark_name,
              members: (w.members as string[]) || [],
              chapter_version: w.chapter_version,
            })));
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetOcName, viewerFaction]);

  const handleReleasePet = (petId: string, petName: string) => {
    const message = farewellMessages[Math.floor(Math.random() * farewellMessages.length)];
    setFarewellModal({ petId, petName, message });
  };

  const confirmReleasePet = async () => {
    if (!farewellModal) return;
    const { petId } = farewellModal;
    setFarewellModal(null);
    setReleasingPet(petId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/character-card/banish-pet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name: currentUserOcName, pet_id: petId, chapter_version: 'ch01_v3' })
      });
      const data = await res.json();
      if (data.success) {
        setPets(prev => prev.filter(p => p.pet_id !== petId));
      }
    } catch (_) {
    } finally {
      setReleasingPet(null);
    }
  };

  const handleSelectOutfit = async (outfitId: string) => {
    if (!userData) return;
    setSelectingOutfit(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/character-card/select-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name: currentUserOcName, outfit_id: outfitId, chapter_version: 'ch01_v3' })
      });
      const data = await res.json();
      if (data.success) {
        setUserData(prev => prev ? { ...prev, current_outfit: outfitId } : prev);
      }
    } catch (_) {
    } finally {
      setSelectingOutfit(false);
    }
  };

  const theme = viewerFaction === 'Turbid' ? TURBID_THEME : LIGHT_THEME;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
        <p className="font-mono text-sm tracking-[0.3em] animate-pulse" style={{ color: theme.textMuted }}>
          正在讀取終端資料...
        </p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60" onClick={onClose}>
        <div className="border p-8 rounded font-mono flex items-center gap-4"
          style={{ background: theme.cardBg, borderColor: theme.border }}>
          <span style={{ color: theme.textSecondary }}>找不到該觀測者的紀錄。</span>
          <button onClick={onClose} style={{ color: theme.textMuted }}>✕</button>
        </div>
      </div>
    );
  }

  const isSame = userData.faction === viewerFaction;
  const displayAlias = userData.alias_name || '???';
  const displayName = userData.cursed_name_prefix
    ? `${userData.cursed_name_prefix}·${displayAlias}`
    : displayAlias;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500;600&family=Noto+Sans+TC:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap');
        
        .character-card-wrapper {
          font-family: 'Noto Serif TC', serif;
        }

        .character-card-body::-webkit-scrollbar {
          width: 6px;
        }

        .character-card-body::-webkit-scrollbar-track {
          background: ${theme.border};
          border-radius: 3px;
        }

        .character-card-body::-webkit-scrollbar-thumb {
          background: ${theme.primary}33;
          border-radius: 3px;
        }

        .character-card-body::-webkit-scrollbar-thumb:hover {
          background: ${theme.primary}80;
        }

        .wc-section-tab {
          position: relative;
          padding: 10px 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${theme.textMuted};
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wc-section-tab:hover {
          color: ${theme.secondary};
        }

        .wc-section-tab.active {
          color: ${theme.textPrimary};
        }

        .wc-section-tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: ${theme.primary};
        }

        .wc-diamond-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }

        .wc-diamond-divider::before,
        .wc-diamond-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${theme.border}, transparent);
        }

        .wc-diamond-divider span {
          width: 6px;
          height: 6px;
          border: 1px solid ${theme.primary};
          transform: rotate(45deg);
        }
      `}</style>

      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 character-card-wrapper"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {showPoem && <RelicPoemModal onClose={() => setShowPoem(false)} />}

        {/* Farewell Modal */}
        {farewellModal && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
            <div
              className="w-full max-w-sm mx-6 rounded border p-6 space-y-5 text-center"
              style={{
                background: theme.cardBg,
                borderColor: theme.border,
                boxShadow: '0 20px 60px rgba(100, 90, 75, 0.15)',
              }}
            >
              <div className="text-base font-bold tracking-widest" style={{ color: theme.textPrimary }}>
                {farewellModal.petName}
              </div>
              <p className="text-[15px] leading-relaxed px-2" style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
                「{farewellModal.message}」
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  className="flex-1 py-2.5 rounded text-sm font-bold tracking-widest transition-all hover:opacity-80"
                  style={{ backgroundColor: theme.primary, color: '#fff' }}
                  onClick={() => setFarewellModal(null)}
                >
                  放棄流放
                </button>
                <button
                  className="px-4 py-2.5 rounded text-[11px] tracking-widest transition-opacity hover:opacity-60"
                  style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}` }}
                  onClick={confirmReleasePet}
                >
                  還是流放
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 主卡片 - 3:4 直立式 */}
        <div
          className="relative w-full max-w-[300px] rounded-lg border overflow-hidden"
          style={{
            background: theme.cardBg,
            borderColor: theme.primary,
            boxShadow: theme.cardShadow,
            aspectRatio: '1 / 2',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 頂部裝飾線 */}
          <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)` }} />

          {/* Header */}
          <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div style={{ width: '6px', height: '6px', border: `1px solid ${theme.primary}`, transform: 'rotate(45deg)' }} />
                <span className="text-[9px] tracking-[0.3em] uppercase font-mono" style={{ color: theme.textMuted }}>
                  觀測者終端
                </span>
              </div>
              <button onClick={onClose} className="hover:opacity-60 transition-opacity">
                <X className="w-4 h-4" style={{ color: theme.textMuted }} />
              </button>
            </div>

            {/* 名稱區 */}
            <div className="text-center space-y-1">
              <div className="text-xl font-bold tracking-wider" style={{ color: theme.textPrimary, letterSpacing: '0.15em' }}>
                {displayName}
              </div>
              {isSame && (
                <div className="text-[10px] tracking-widest font-mono" style={{ color: theme.textMuted }}>
                  {userData.oc_name}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-[9px] px-2 py-0.5 rounded border font-mono"
                  style={{
                    borderColor: userData.faction === 'Turbid' ? theme.primary : theme.factionGold,
                    color: userData.faction === 'Turbid' ? theme.primary : theme.factionGold,
                  }}>
                  {userData.faction === 'Turbid' ? 'TURBID' : 'PURE'}
                </span>
              </div>
            </div>

            {userData.cursed_name_prefix && (
              <div className="mt-2 text-center">
                <span className="text-[9px] px-2 py-0.5 rounded inline-block"
                  style={{ backgroundColor: `${FACTION_COLORS.leaderEvil}15`, color: '#c0392b', border: `1px solid ${FACTION_COLORS.leaderEvil}50` }}>
                  ⚠ 領主詛咒施加中
                </span>
              </div>
            )}
          </div>

          {/* 裝飾分隔線 */}
          <div className="wc-diamond-divider px-5 flex-shrink-0">
            <span />
          </div>

          {/* 敵方陣營簡化顯示 */}
          {!isSame ? (
            <div className="flex-1 flex items-center justify-center px-5 pb-8">
              <div className="text-center space-y-2">
                <div className="text-xs tracking-[0.3em] uppercase" style={{ color: theme.textMuted }}>
                  [ 敵方陣營 · 資訊受限 ]
                </div>
                <div className="text-[10px]" style={{ color: theme.textMuted }}>
                  僅顯示匿名代號與陣營標記
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Section Tabs */}
              <div className="flex border-b px-5 flex-shrink-0" style={{ borderColor: theme.border }}>
                <button
                  onClick={() => setActiveSection('info')}
                  className={`wc-section-tab flex-1 ${activeSection === 'info' ? 'active' : ''}`}
                >
                  基本
                </button>
                <button
                  onClick={() => setActiveSection('pets')}
                  className={`wc-section-tab flex-1 ${activeSection === 'pets' ? 'active' : ''}`}
                >
                  生物 ({pets.length})
                </button>
                <button
                  onClick={() => setActiveSection('relics')}
                  className={`wc-section-tab flex-1 ${activeSection === 'relics' ? 'active' : ''}`}
                >
                  遺物 ({relics.length})
                </button>
                <button
                  onClick={() => setActiveSection('witness')}
                  className={`wc-section-tab flex-1 ${activeSection === 'witness' ? 'active' : ''}`}
                >
                  見證
                </button>
              </div>

              {/* Body - 可滾動內容區 */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 character-card-body">
                
                {/* 基本資訊 */}
                {activeSection === 'info' && (
                  <div className="space-y-4">
                    {/* HP Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] tracking-[0.2em] uppercase font-mono" style={{ color: theme.textMuted }}>生命值</span>
                        <span className="text-xs font-mono" style={{ color: theme.textPrimary }}>
                          {userData.current_hp} / {userData.max_hp}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(userData.max_hp, 10) }).map((_, i) => (
                          <div
                            key={i}
                            className="h-2 flex-1 rounded-sm"
                            style={{
                              backgroundColor: i < userData.current_hp ? theme.primary : theme.border,
                              opacity: i < userData.current_hp ? 1 : 0.3,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Coins */}
                    <div className="flex items-center justify-between px-3 py-2 rounded border"
                      style={{ borderColor: theme.border, backgroundColor: theme.itemBg }}>
                      <span className="text-[10px] tracking-[0.2em] uppercase font-mono" style={{ color: theme.textMuted }}>貨幣</span>
                      <span className="text-sm font-mono font-bold" style={{ color: theme.textPrimary }}>
                        {userData.coins}
                      </span>
                    </div>

                    {/* Current Outfit */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] tracking-[0.2em] uppercase font-mono" style={{ color: theme.textMuted }}>當前衣裝</span>
                      {targetOcName === currentUserOcName && userData.wardrobe.length > 0 ? (
                        <select
                          value={userData.current_outfit || ''}
                          onChange={(e) => handleSelectOutfit(e.target.value)}
                          disabled={selectingOutfit}
                          className="w-full text-xs px-3 py-2 rounded border outline-none cursor-pointer disabled:opacity-50 font-mono"
                          style={{
                            borderColor: theme.border,
                            color: theme.textPrimary,
                            backgroundColor: theme.itemBg,
                          }}
                        >
                          <option value="">— 選擇衣裝 —</option>
                          {userData.wardrobe.map((id) => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm px-3 py-2 rounded border font-mono"
                          style={{
                            borderColor: theme.border,
                            color: userData.current_outfit ? theme.textPrimary : theme.textMuted,
                            backgroundColor: theme.itemBg,
                          }}>
                          {userData.current_outfit || '（未選擇）'}
                        </div>
                      )}
                    </div>

                    {/* Karma Tags */}
                    {(() => {
                      const activeTags = userData.karma_tags.filter(kt => !kt.is_faded);
                      const fadedTags = fadedMarksFromApi.length > 0
                        ? fadedMarksFromApi
                        : userData.karma_tags.filter(kt => kt.is_faded).map(kt => ({
                            tag_id: kt.tag,
                            name: kt.tag,
                            description: kt.description || '',
                            timestamp: kt.faded_at || '',
                          }));

                      if (activeTags.length === 0 && fadedTags.length === 0) return null;

                      return (
                        <div className="space-y-3">
                          {activeTags.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] tracking-[0.2em] uppercase font-mono" style={{ color: theme.textMuted }}>因果標籤</span>
                              <div className="flex flex-wrap gap-2">
                                {activeTags.map((kt, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setActiveKarmaTooltip(activeKarmaTooltip === kt.tag ? null : kt.tag)}
                                    className="text-xs px-2 py-0.5 rounded border transition-all font-mono"
                                    style={{
                                      borderColor: theme.primary,
                                      color: theme.textPrimary,
                                      backgroundColor: activeKarmaTooltip === kt.tag ? theme.fadedBg : theme.itemBg,
                                    }}
                                  >
                                    {kt.tag}
                                  </button>
                                ))}
                              </div>
                              {activeKarmaTooltip && KARMA_DESC[activeKarmaTooltip] && (
                                <p className="text-[11px] leading-relaxed px-2 py-1.5 rounded italic border-l-2"
                                  style={{ color: theme.textSecondary, backgroundColor: theme.itemBg, borderColor: theme.primary }}>
                                  {KARMA_DESC[activeKarmaTooltip]}
                                </p>
                              )}
                            </div>
                          )}

                          {fadedTags.length > 0 && (
                            <div className="space-y-1.5">
                              <button
                                onClick={() => { setShowFadedSection(v => !v); setActiveFadedTooltip(null); }}
                                className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-80 font-mono"
                                style={{ color: theme.textMuted, opacity: 0.7 }}
                              >
                                <span style={{ fontSize: '8px' }}>{showFadedSection ? '▾' : '▸'}</span>
                                褪色印記
                                <span className="ml-1 text-[9px] px-1 rounded"
                                  style={{ backgroundColor: `${theme.fadedBg}`, color: theme.textMuted }}>
                                  {fadedTags.length}
                                </span>
                              </button>

                              {showFadedSection && (
                                <div className="space-y-1.5 pl-1">
                                  <div className="flex flex-wrap gap-2">
                                    {fadedTags.map((ft, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setActiveFadedTooltip(activeFadedTooltip === ft.name ? null : ft.name)}
                                        className="text-xs px-2 py-0.5 rounded border transition-all font-mono"
                                        style={{
                                          borderColor: theme.border,
                                          color: theme.textMuted,
                                          opacity: activeFadedTooltip === ft.name ? 0.65 : 0.4,
                                          textDecoration: 'line-through',
                                        }}
                                      >
                                        {ft.name}
                                      </button>
                                    ))}
                                  </div>
                                  {activeFadedTooltip && (() => {
                                    const ft = fadedTags.find(t => t.name === activeFadedTooltip);
                                    if (!ft) return null;
                                    const desc = ft.description || KARMA_DESC[ft.name];
                                    const dateStr = ft.timestamp
                                      ? new Date(ft.timestamp).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
                                      : null;
                                    return (
                                      <div className="px-2 py-1.5 rounded space-y-0.5 border-l-2"
                                        style={{ backgroundColor: theme.itemBg, borderColor: theme.border }}>
                                        {desc && (
                                          <p className="text-[11px] leading-relaxed italic" style={{ color: theme.textMuted, opacity: 0.75 }}>{desc}</p>
                                        )}
                                        {dateStr && (
                                          <p className="text-[10px] tracking-widest font-mono" style={{ color: theme.textMuted, opacity: 0.45 }}>
                                            ✦ 褪色於 {dateStr}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Status Tags */}
                    {userData.status_tags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] tracking-[0.2em] uppercase font-mono" style={{ color: theme.textMuted }}>特殊狀態</span>
                        <div className="flex flex-wrap gap-2">
                          {userData.status_tags.map((st, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded font-mono"
                              style={{ backgroundColor: `${FACTION_COLORS.leaderEvil}20`, color: '#c0392b', border: `1px solid ${FACTION_COLORS.leaderEvil}50` }}>
                              {st.tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 同行生物 */}
                {activeSection === 'pets' && (
                  <div className="space-y-2">
                    {pets.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-xs italic" style={{ color: theme.textMuted }}>目前無同行生物。</div>
                      </div>
                    ) : (
                      pets.map(pet => (
                        <div key={pet.pet_id} className="rounded border px-3 py-2"
                          style={{ borderColor: theme.border, backgroundColor: theme.itemBg }}>
                          <div className="flex items-center justify-between">
                            <button
                              className="text-xs text-left hover:underline"
                              style={{ color: theme.textPrimary }}
                              onClick={() => setExpandedPet(expandedPet === pet.pet_id ? null : pet.pet_id)}
                            >
                              {expandedPet === pet.pet_id ? '▾' : '▸'} {pet.pet_name}
                            </button>
                            {targetOcName === currentUserOcName && (
                              <button
                                onClick={() => handleReleasePet(pet.pet_id, pet.pet_name)}
                                disabled={releasingPet === pet.pet_id}
                                className="text-[10px] tracking-widest transition-colors disabled:opacity-50 font-mono"
                                style={{ color: theme.textMuted }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#c0392b')}
                                onMouseLeave={e => (e.currentTarget.style.color = theme.textMuted)}
                              >
                                {releasingPet === pet.pet_id ? '流放中...' : '[ 流放 ]'}
                              </button>
                            )}
                          </div>
                          {(pet.personality || pet.habit) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {pet.personality && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded border font-mono"
                                  style={{ borderColor: theme.border, color: theme.textSecondary }}>
                                  {pet.personality}
                                </span>
                              )}
                              {pet.habit && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded border font-mono"
                                  style={{ borderColor: theme.border, color: theme.textSecondary }}>
                                  {pet.habit}
                                </span>
                              )}
                            </div>
                          )}
                          {expandedPet === pet.pet_id && (
                            <p className="mt-1.5 text-[11px] border-t pt-1.5 leading-relaxed"
                              style={{ borderColor: theme.border, color: theme.textSecondary }}>
                              {pet.pet_description}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 遺物 */}
                {activeSection === 'relics' && (
                  <div className="space-y-3">
                    {relics.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-xs italic" style={{ color: theme.textMuted }}>尚無收集遺物。</div>
                      </div>
                    ) : (() => {
                      const bySeriesMap: Record<string, Relic[]> = {};
                      for (const r of relics) {
                        const meta = RELIC_CATALOG[r.relic_id];
                        const series = meta?.series || '未知系列';
                        if (!bySeriesMap[series]) bySeriesMap[series] = [];
                        bySeriesMap[series].push(r);
                      }

                      return Object.entries(bySeriesMap).map(([series, seriesRelics]) => {
                        const albumSeries = ALBUM_LOGIC[series];
                        const isComplete = albumSeries && seriesRelics.length >= albumSeries.required_count;

                        return (
                          <div key={series} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] tracking-widest font-mono"
                                style={{ color: isComplete ? theme.factionGold : theme.textMuted }}>
                                {isComplete ? '◆' : '◇'} {series}
                              </span>
                              {albumSeries && (
                                <span className="text-[9px] tracking-widest font-mono"
                                  style={{ color: theme.textMuted, opacity: 0.7 }}>
                                  {seriesRelics.length} / {albumSeries.required_count}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              {seriesRelics.map((r) => {
                                const meta = RELIC_CATALOG[r.relic_id];
                                const isExpanded = expandedRelic === r.relic_id;
                                return (
                                  <div key={r.relic_id} className="rounded border"
                                    style={{ borderColor: theme.border, backgroundColor: theme.itemBg }}>
                                    <button
                                      className="w-full flex items-center justify-between px-3 py-2 text-left"
                                      onClick={() => setExpandedRelic(isExpanded ? null : r.relic_id)}
                                    >
                                      <span className="text-xs" style={{ color: theme.textPrimary }}>
                                        {isExpanded ? '▾' : '▸'} {r.name}
                                      </span>
                                    </button>
                                    {isExpanded && (
                                      <div className="px-3 pb-2.5 space-y-1.5 border-t"
                                        style={{ borderColor: theme.border }}>
                                        <p className="text-[11px] leading-relaxed pt-1.5"
                                          style={{ color: theme.textSecondary }}>
                                          {r.description}
                                        </p>
                                        {meta?.lore && (
                                          <p className="text-[11px] leading-relaxed italic px-2 py-1.5 rounded border-l-2"
                                            style={{ color: theme.textMuted, backgroundColor: theme.itemBg, borderColor: theme.primary }}>
                                            {meta.lore}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {isComplete && albumSeries && (
                              <button
                                className="w-full px-3 py-2 rounded text-[10px] tracking-widest text-center font-mono transition-opacity hover:opacity-80"
                                style={{
                                  backgroundColor: 'rgba(212,175,55,0.1)',
                                  border: `1px solid ${theme.factionGold}60`,
                                  color: theme.factionGold,
                                }}
                                onClick={() => setShowPoem(true)}
                              >
                                ✦ 已解鎖：{albumSeries.reward_name} — 點擊重播
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* 見證紀錄 */}
                {activeSection === 'witness' && (
                  <div className="space-y-2">
                    {witnessRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-xs italic" style={{ color: theme.textMuted }}>尚無組隊見證紀錄。</div>
                      </div>
                    ) : (
                      witnessRecords.map((rec, i) => (
                        <div key={i} className="text-[11px] px-2 py-1.5 border-l-2 rounded-r"
                          style={{ borderColor: theme.primary, backgroundColor: theme.itemBg }}>
                          <span style={{ color: theme.textPrimary }}>{rec.landmark_name}</span>
                          <span style={{ color: theme.textMuted }}> · Ch{rec.chapter_version} · </span>
                          <span style={{ color: theme.textSecondary }}>
                            {rec.members.filter(m => m !== targetOcName).join('、') || '（獨自見證）'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="px-5 py-2 border-t flex justify-between text-[9px] tracking-widest font-mono flex-shrink-0"
            style={{ borderColor: theme.border, backgroundColor: theme.itemBg, color: theme.textMuted }}>
            <span>TURBID DUST</span>
            <span>TERMINAL v1.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

