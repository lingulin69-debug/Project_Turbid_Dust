import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import farewellMessages from '@/data/pet-farewell-messages.json';
import karmaTagsData from '@/data/karma-tags.json';
import { FACTION_COLORS } from '@/lib/constants';

type KarmaTagEntry = { tag: string; description: string };

const karmaEntries: KarmaTagEntry[] = [
  ...((karmaTagsData as { behavior_tags: KarmaTagEntry[]; party_tags: KarmaTagEntry[] }).behavior_tags || []),
  ...((karmaTagsData as { behavior_tags: KarmaTagEntry[]; party_tags: KarmaTagEntry[] }).party_tags || []),
];

const KARMA_DESC: Record<string, string> = Object.fromEntries(
  karmaEntries.map(k => [k.tag, k.description])
);

interface KarmaTag {
  tag: string;
  is_faded: boolean;
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

// ── Palette ───────────────────────────────────────────────────────────────────
// 統一用暖金棕色系，不依陣營切換
const CARD = {
  bg: '#C09D67',          // 卡片底色
  bgDeep: '#95785A',      // 佔位框/次要背景
  deco: '#D1A26E',        // 裝飾線 / 邊框高光
  decoMuted: '#A8804A',   // 次要裝飾
  textPrimary: '#2C1A06',  // 主要文字（深棕，對比度高）
  textSecondary: '#5A3A18', // 次要文字
  textMuted: '#7A5530',   // 說明文字
  divider: '#B08850',     // 分隔線
  tagBg: '#A07840',       // 標籤底色
  tagBorder: '#C8966A',   // 標籤邊框
};

// ── Portrait Panel ────────────────────────────────────────────────────────────
// Displays character illustration. Falls back to placeholder when image 404s.
// To activate: drop  public/assets/portraits/{oc_name}_normal.png  and refresh.

const PortraitPanel: React.FC<{
  src: string;
  displayName: string;
  factionLabel: string;
}> = ({ src, displayName, factionLabel }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: '3 / 4',
        maxHeight: '280px',
        background: CARD.bgDeep,
        borderBottom: `1px solid ${CARD.decoMuted}`,
      }}
    >
      {!imgError ? (
        <img
          src={src}
          alt={displayName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top"
          style={{ display: 'block' }}
        />
      ) : (
        /* ── Placeholder ── */
        <div className="w-full h-full flex flex-col items-center justify-center relative"
          style={{ background: `linear-gradient(170deg, ${CARD.bgDeep} 0%, #7A5A3A 100%)` }}
        >
          {/* Dot-grid texture */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, ${CARD.deco}22 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }} />
          {/* Corner brackets */}
          {(['top-3 left-3', 'top-3 right-3', 'bottom-12 left-3', 'bottom-12 right-3'] as const).map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-5 h-5`} style={{
              borderTop:    i < 2 ? `2px solid ${CARD.deco}` : undefined,
              borderBottom: i >= 2 ? `2px solid ${CARD.deco}` : undefined,
              borderLeft:   i % 2 === 0 ? `2px solid ${CARD.deco}` : undefined,
              borderRight:  i % 2 === 1 ? `2px solid ${CARD.deco}` : undefined,
            }} />
          ))}
          {/* Center */}
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <div className="px-3 py-0.5 text-[9px] tracking-[0.4em] uppercase font-mono"
              style={{ border: `1px solid ${CARD.deco}80`, color: CARD.deco, backgroundColor: `${CARD.deco}18` }}>
              {factionLabel}
            </div>
            <p className="text-sm tracking-[0.15em] font-mono" style={{ color: CARD.deco }}>{displayName}</p>
            <p className="text-[10px] tracking-[0.35em] uppercase font-mono" style={{ color: CARD.textMuted }}>
              插畫載入中
            </p>
            <div className="w-20 h-px relative overflow-hidden" style={{ backgroundColor: `${CARD.deco}30` }}>
              <div className="absolute top-0 left-0 h-full" style={{
                width: '40%', backgroundColor: CARD.deco,
                animation: 'slide-loading 1.8s ease-in-out infinite',
              }} />
            </div>
          </div>
          {/* Bottom strip */}
          <div className="absolute bottom-0 left-0 right-0 py-1.5 flex items-center justify-center"
            style={{ borderTop: `1px solid ${CARD.decoMuted}60`, backgroundColor: `${CARD.bgDeep}cc` }}>
            <span className="text-[8px] tracking-[0.45em] uppercase font-mono" style={{ color: CARD.textMuted }}>
              PORTRAIT PENDING
            </span>
          </div>
        </div>
      )}
      {/* Fade to card body */}
      <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${CARD.bg})` }} />
    </div>
  );
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  targetOcName,
  viewerFaction,
  currentUserOcName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<TargetUserData | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [witnessRecords, setWitnessRecords] = useState<WitnessRecord[]>([]);
  const [expandedPet, setExpandedPet] = useState<string | null>(null);
  const [releasingPet, setReleasingPet] = useState<string | null>(null);
  const [farewellModal, setFarewellModal] = useState<{ petId: string; petName: string; message: string } | null>(null);
  const [activeKarmaTooltip, setActiveKarmaTooltip] = useState<string | null>(null);
  const [selectingOutfit, setSelectingOutfit] = useState(false);

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

        // Only fetch full data for same faction
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
        // silent fail
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
      } else {
        alert(data.error || '操作失敗，請稍後再試。');
      }
    } catch (_) {
      alert('操作失敗，請稍後再試。');
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
      // silent
    } finally {
      setSelectingOutfit(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <p className="font-mono text-sm tracking-[0.3em] animate-pulse" style={{ color: CARD.textMuted }}>
          正在讀取終端資料...
        </p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="border p-8 rounded font-mono flex items-center gap-4"
          style={{ backgroundColor: CARD.bg, borderColor: CARD.decoMuted, color: CARD.textSecondary }}>
          找不到該觀測者的紀錄。
          <button onClick={onClose} style={{ color: CARD.textMuted }} className="hover:opacity-60 transition-opacity">✕</button>
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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Farewell modal */}
      {farewellModal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-sm mx-6 rounded border p-6 space-y-5 text-center"
            style={{
              backgroundColor: CARD.bg,
              borderColor: CARD.decoMuted,
              boxShadow: `0 8px 40px ${CARD.bgDeep}80`,
              fontFamily: 'monospace',
            }}
          >
            <div className="text-base font-bold tracking-widest" style={{ color: CARD.textPrimary }}>
              {farewellModal.petName}
            </div>
            <p className="text-[15px] leading-relaxed px-2" style={{ color: CARD.textSecondary, fontStyle: 'italic' }}>
              「{farewellModal.message}」
            </p>
            <div className="flex gap-3 pt-1">
              <button
                className="flex-1 py-2.5 rounded text-sm font-bold tracking-widest transition-all"
                style={{ backgroundColor: CARD.decoMuted, color: '#fff' }}
                onClick={() => setFarewellModal(null)}
              >
                放棄流放
              </button>
              <button
                className="px-4 py-2.5 rounded text-[11px] tracking-widest transition-colors"
                style={{ backgroundColor: 'transparent', color: CARD.textMuted, border: `1px solid ${CARD.divider}` }}
                onClick={confirmReleasePet}
              >
                還是流放
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className="relative w-full max-w-md mx-4 rounded border overflow-hidden"
        style={{
          backgroundColor: CARD.bg,
          borderColor: CARD.deco,
          boxShadow: `0 8px 60px ${CARD.bgDeep}90`,
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: CARD.divider, backgroundColor: CARD.bgDeep }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: CARD.textMuted }}>
              觀測者終端
            </span>
            <span style={{ color: CARD.deco }}>▸</span>
            <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.deco }}>
              {userData.faction === 'Turbid' ? 'TURBID' : 'PURE'}
            </span>
          </div>
          <button onClick={onClose} style={{ color: CARD.textMuted }} className="hover:opacity-60 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Illustration Panel ──────────────────────────────────────────
            切換邏輯：
              優先讀取 /assets/portraits/{oc_name}_normal.png
              未來只需將圖檔放入 public/assets/portraits/ 即可自動顯示
            ──────────────────────────────────────────────────────────── */}
        {(() => {
          // Portrait path convention: /assets/portraits/{oc_name}_normal.png
          // If the file doesn't exist the browser fires onError → fall back to placeholder
          const portraitSrc = `/assets/portraits/${userData.oc_name}_normal.png`;
          return (
            <PortraitPanel
              src={portraitSrc}
              displayName={displayName}
              factionLabel={userData.faction === 'Turbid' ? 'TURBID' : 'PURE'}
            />
          );
        })()}

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar"
          style={{ backgroundColor: CARD.bg }}>

          {/* Alias + OC Name */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 rounded-full" style={{ backgroundColor: CARD.deco }} />
              <div>
                <div className="text-xl font-bold tracking-wider" style={{ color: CARD.textPrimary }}>
                  {displayName}
                </div>
                {isSame && (
                  <div className="text-[11px] tracking-widest mt-0.5" style={{ color: CARD.textMuted }}>
                    {userData.oc_name}
                  </div>
                )}
              </div>
            </div>
            {userData.cursed_name_prefix && (
              <div
                className="text-[10px] px-2 py-0.5 rounded ml-4 inline-block mt-1"
                style={{ backgroundColor: `${FACTION_COLORS.leaderEvil}25`, color: '#c0392b', borderLeft: `2px solid ${FACTION_COLORS.leaderEvil}` }}
              >
                ⚠ 領主詛咒施加中
              </div>
            )}
          </div>

          {/* Enemy faction: minimal display */}
          {!isSame ? (
            <div className="py-10 text-center space-y-2">
              <div className="text-xs tracking-[0.3em] uppercase" style={{ color: CARD.textMuted }}>
                [ 敵方陣營 · 資訊受限 ]
              </div>
              <div className="text-[10px]" style={{ color: CARD.textMuted }}>
                僅顯示匿名代號與陣營標記
              </div>
            </div>
          ) : (
            <>
              {/* HP Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>生命值</span>
                  <span className="text-xs font-mono" style={{ color: CARD.textPrimary }}>
                    {userData.current_hp} / {userData.max_hp}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(userData.max_hp, 10) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-sm"
                      style={{
                        backgroundColor: i < userData.current_hp ? CARD.decoMuted : CARD.divider,
                        opacity: i < userData.current_hp ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>貨幣</span>
                <span className="text-sm font-mono font-bold" style={{ color: CARD.textPrimary }}>
                  {userData.coins}
                </span>
              </div>

              {/* Current Outfit */}
              <div className="space-y-1.5">
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>當前衣裝</span>
                {targetOcName === currentUserOcName && userData.wardrobe.length > 0 ? (
                  <select
                    value={userData.current_outfit || ''}
                    onChange={(e) => handleSelectOutfit(e.target.value)}
                    disabled={selectingOutfit}
                    className="w-full text-xs px-3 py-1.5 rounded border outline-none cursor-pointer disabled:opacity-50"
                    style={{
                      borderColor: CARD.divider,
                      color: CARD.textPrimary,
                      backgroundColor: CARD.bgDeep,
                    }}
                  >
                    <option value="" disabled style={{ backgroundColor: CARD.bgDeep }}>— 選擇衣裝 —</option>
                    {userData.wardrobe.map((id) => (
                      <option key={id} value={id} style={{ backgroundColor: CARD.bgDeep, color: CARD.textPrimary }}>{id}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm px-3 py-1.5 rounded border"
                    style={{ borderColor: CARD.divider, color: userData.current_outfit ? CARD.textPrimary : CARD.textMuted, backgroundColor: CARD.bgDeep }}>
                    {userData.current_outfit || '（未選擇）'}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${CARD.divider}` }} />

              {/* Karma Tags */}
              {userData.karma_tags.length > 0 && (() => {
                const activeTags = userData.karma_tags.filter(kt => !kt.is_faded);
                const fadedTags = userData.karma_tags.filter(kt => kt.is_faded);
                return (
                  <div className="space-y-2">
                    {activeTags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>因果標籤</span>
                        <div className="flex flex-wrap gap-2">
                          {activeTags.map((kt, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveKarmaTooltip(activeKarmaTooltip === kt.tag ? null : kt.tag)}
                              className="text-xs px-2 py-0.5 rounded border transition-opacity"
                              style={{
                                borderColor: CARD.tagBorder,
                                color: CARD.textPrimary,
                                backgroundColor: activeKarmaTooltip === kt.tag ? CARD.tagBg : `${CARD.tagBg}60`,
                              }}
                            >
                              {kt.tag}
                            </button>
                          ))}
                        </div>
                        {activeKarmaTooltip && KARMA_DESC[activeKarmaTooltip] && activeTags.some(t => t.tag === activeKarmaTooltip) && (
                          <p className="text-[11px] leading-relaxed px-2 py-1.5 rounded italic"
                            style={{ color: CARD.textSecondary, backgroundColor: CARD.bgDeep, border: `1px solid ${CARD.divider}` }}>
                            {KARMA_DESC[activeKarmaTooltip]}
                          </p>
                        )}
                      </div>
                    )}
                    {fadedTags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>褪色印記</span>
                        <div className="flex flex-wrap gap-2">
                          {fadedTags.map((kt, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveKarmaTooltip(activeKarmaTooltip === kt.tag ? null : kt.tag)}
                              className="text-xs px-2 py-0.5 rounded border"
                              style={{
                                borderColor: CARD.divider,
                                color: CARD.textMuted,
                                opacity: 0.5,
                                textDecoration: 'line-through',
                                backgroundColor: 'transparent',
                              }}
                            >
                              {kt.tag}
                            </button>
                          ))}
                        </div>
                        {activeKarmaTooltip && KARMA_DESC[activeKarmaTooltip] && fadedTags.some(t => t.tag === activeKarmaTooltip) && (
                          <p className="text-[11px] leading-relaxed px-2 py-1.5 rounded italic"
                            style={{ color: CARD.textMuted, backgroundColor: CARD.bgDeep, border: `1px solid ${CARD.divider}` }}>
                            {KARMA_DESC[activeKarmaTooltip]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Status Tags */}
              {userData.status_tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>特殊狀態</span>
                  <div className="flex flex-wrap gap-2">
                    {userData.status_tags.map((st, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${FACTION_COLORS.leaderEvil}20`, color: '#c0392b', border: `1px solid ${FACTION_COLORS.leaderEvil}50` }}>
                        {st.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pets */}
              <div className="space-y-2">
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>
                  同行生物（{pets.length}/3）
                </span>
                {pets.length === 0 ? (
                  <div className="text-xs italic" style={{ color: CARD.textMuted }}>目前無同行生物。</div>
                ) : (
                  <div className="space-y-1.5">
                    {pets.map(pet => (
                      <div key={pet.pet_id} className="rounded border px-3 py-2"
                        style={{ borderColor: CARD.divider, backgroundColor: CARD.bgDeep }}>
                        <div className="flex items-center justify-between">
                          <button
                            className="text-xs text-left hover:underline"
                            style={{ color: CARD.textPrimary }}
                            onClick={() => setExpandedPet(expandedPet === pet.pet_id ? null : pet.pet_id)}
                          >
                            ▸ {pet.pet_name}
                          </button>
                          {targetOcName === currentUserOcName && (
                            <button
                              onClick={() => handleReleasePet(pet.pet_id, pet.pet_name)}
                              disabled={releasingPet === pet.pet_id}
                              className="text-[10px] tracking-widest transition-colors disabled:opacity-50"
                              style={{ color: CARD.textMuted }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#c0392b')}
                              onMouseLeave={e => (e.currentTarget.style.color = CARD.textMuted)}
                            >
                              {releasingPet === pet.pet_id ? '流放中...' : '[ 流放 ]'}
                            </button>
                          )}
                        </div>
                        {(pet.personality || pet.habit) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pet.personality && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded border"
                                style={{ borderColor: CARD.tagBorder, color: CARD.textSecondary }}>
                                {pet.personality}
                              </span>
                            )}
                            {pet.habit && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded border"
                                style={{ borderColor: CARD.tagBorder, color: CARD.textSecondary }}>
                                {pet.habit}
                              </span>
                            )}
                          </div>
                        )}
                        {expandedPet === pet.pet_id && (
                          <p className="mt-1.5 text-[11px] border-t pt-1.5 leading-relaxed"
                            style={{ borderColor: CARD.divider, color: CARD.textSecondary }}>
                            {pet.pet_description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Witness Records */}
              <div className="space-y-2">
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: CARD.textMuted }}>見證紀錄</span>
                {witnessRecords.length === 0 ? (
                  <div className="text-xs italic" style={{ color: CARD.textMuted }}>尚無組隊見證紀錄。</div>
                ) : (
                  <div className="space-y-1">
                    {witnessRecords.map((rec, i) => (
                      <div key={i} className="text-[11px] px-2 py-1 border-l-2"
                        style={{ borderColor: CARD.deco, color: CARD.textSecondary }}>
                        <span style={{ color: CARD.textPrimary }}>{rec.landmark_name}</span>
                        <span style={{ color: CARD.textMuted }}> · Ch{rec.chapter_version} · </span>
                        <span>{rec.members.filter(m => m !== targetOcName).join('、') || '（獨自見證）'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t flex justify-between text-[10px] tracking-widest"
          style={{ borderColor: CARD.divider, backgroundColor: CARD.bgDeep, color: CARD.textMuted }}>
          <span>PROJECT TURBID DUST</span>
          <span>OBSERVER TERMINAL v1.0</span>
        </div>
      </div>
    </div>
  );
};
