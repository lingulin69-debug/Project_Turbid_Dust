import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/api/client';
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

const FACTION_STYLE = {
  Turbid: {
    bg: FACTION_COLORS.Turbid.primary,
    accent: FACTION_COLORS.Turbid.highlight,
    label: '濁息者',
    text: '#e5e0f0',
    sub: '#a09ab8',
  },
  Pure: {
    bg: FACTION_COLORS.Pure.primary,
    accent: FACTION_COLORS.Pure.highlight,
    label: '淨塵者',
    text: '#1a1a0a',
    sub: '#5a5030',
  },
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: user } = await (supabase as any)
          .from('td_users')
          .select('oc_name, faction, alias_name, cursed_name_prefix, karma_tags, status_tags, current_outfit, current_hp, max_hp, coins')
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
      await apiClient.pets.release(currentUserOcName, petId);
      setPets(prev => prev.filter(p => p.pet_id !== petId));
    } catch (_) {
      alert('操作失敗，請稍後再試。');
    } finally {
      setReleasingPet(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <p className="text-gray-400 font-mono text-sm tracking-[0.3em] animate-pulse">
          正在讀取終端資料...
        </p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <div
          className="border border-gray-700 p-8 rounded font-mono text-gray-400 flex items-center gap-4"
          style={{ backgroundColor: FACTION_COLORS.background }}
        >
          找不到該觀測者的紀錄。
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>
      </div>
    );
  }

  const isSame = userData.faction === viewerFaction;
  const style = FACTION_STYLE[userData.faction];
  const displayAlias = userData.alias_name || '???';
  const displayName = userData.cursed_name_prefix
    ? `${userData.cursed_name_prefix}·${displayAlias}`
    : displayAlias;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Farewell modal */}
      {farewellModal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-sm mx-6 rounded border p-6 space-y-5 text-center"
            style={{
              backgroundColor: FACTION_COLORS.background,
              borderColor: `${style.accent}55`,
              boxShadow: `0 0 40px ${style.accent}18`,
              fontFamily: 'monospace',
            }}
          >
            <div className="text-base font-bold tracking-widest" style={{ color: style.accent }}>
              {farewellModal.petName}
            </div>
            <p
              className="text-[15px] leading-relaxed px-2"
              style={{ color: '#ffffff', fontStyle: 'italic' }}
            >
              「{farewellModal.message}」
            </p>
            <div className="flex gap-3 pt-1">
              <button
                className="flex-1 py-2.5 rounded text-sm font-bold tracking-widest transition-all"
                style={{
                  backgroundColor: style.accent,
                  color: style.bg || '#fff',
                }}
                onClick={() => setFarewellModal(null)}
              >
                放棄流放
              </button>
              <button
                className="px-4 py-2.5 rounded text-[11px] tracking-widest transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: '#555',
                  border: '1px solid #2a2a2a',
                }}
                onClick={confirmReleasePet}
              >
                還是流放
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="relative w-full max-w-md mx-4 rounded border"
        style={{
          backgroundColor: FACTION_COLORS.background,
          borderColor: style.accent,
          boxShadow: `0 0 40px ${style.accent}25, 0 0 80px ${style.accent}08`,
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: `${style.accent}35`, backgroundColor: `${style.bg}18` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: style.sub }}>
              觀測者終端
            </span>
            <span style={{ color: style.accent }}>▸</span>
            <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: style.accent }}>
              {userData.faction === 'Turbid' ? 'TURBID' : 'PURE'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Alias + OC Name */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 rounded-full" style={{ backgroundColor: style.accent }} />
              <div>
                <div className="text-xl font-bold tracking-wider" style={{ color: style.accent }}>
                  {displayName}
                </div>
                {isSame && (
                  <div className="text-[11px] text-gray-600 tracking-widest mt-0.5">
                    {userData.oc_name}
                  </div>
                )}
              </div>
            </div>
            {userData.cursed_name_prefix && (
              <div
                className="text-[10px] px-2 py-0.5 rounded ml-4 inline-block mt-1"
                style={{ backgroundColor: `${FACTION_COLORS.leaderEvil}20`, color: '#f87171', borderLeft: `2px solid ${FACTION_COLORS.leaderEvil}` }}
              >
                ⚠ 領主詛咒施加中
              </div>
            )}
          </div>

          {/* Enemy faction: minimal display */}
          {!isSame ? (
            <div className="py-10 text-center space-y-2">
              <div className="text-xs tracking-[0.3em] uppercase" style={{ color: style.sub }}>
                [ 敵方陣營 · 資訊受限 ]
              </div>
              <div className="text-[10px] text-gray-700">
                僅顯示匿名代號與陣營標記
              </div>
            </div>
          ) : (
            <>
              {/* HP Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">生命值</span>
                  <span className="text-xs" style={{ color: style.accent }}>
                    {userData.current_hp} / {userData.max_hp}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(userData.max_hp, 10) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-sm"
                      style={{
                        backgroundColor: i < userData.current_hp ? style.accent : '#1e1e2e',
                        opacity: i < userData.current_hp ? 1 : 0.35,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">貨幣</span>
                <span className="text-sm" style={{ color: style.accent }}>
                  {userData.coins}
                </span>
              </div>

              {/* Current Outfit */}
              {userData.current_outfit && (
                <div className="space-y-1.5">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">當前衣裝</span>
                  <div
                    className="text-sm px-3 py-1.5 rounded border"
                    style={{
                      borderColor: `${style.accent}35`,
                      color: style.text,
                      backgroundColor: `${style.bg}15`,
                    }}
                  >
                    {userData.current_outfit}
                  </div>
                </div>
              )}

              {/* Karma Tags */}
              {userData.karma_tags.length > 0 && (() => {
                const activeTags = userData.karma_tags.filter(kt => !kt.is_faded);
                const fadedTags = userData.karma_tags.filter(kt => kt.is_faded);
                return (
                  <div className="space-y-2">
                    {/* 現役標籤 */}
                    {activeTags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">因果標籤</span>
                        <div className="flex flex-wrap gap-2">
                          {activeTags.map((kt, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveKarmaTooltip(activeKarmaTooltip === kt.tag ? null : kt.tag)}
                              className="text-xs px-2 py-0.5 rounded border transition-opacity"
                              style={{
                                borderColor: `${style.accent}50`,
                                color: style.accent,
                                backgroundColor: activeKarmaTooltip === kt.tag ? `${style.accent}20` : `${style.accent}10`,
                              }}
                            >
                              {kt.tag}
                            </button>
                          ))}
                        </div>
                        {/* 描述提示框 */}
                        {activeKarmaTooltip && KARMA_DESC[activeKarmaTooltip] && activeTags.some(t => t.tag === activeKarmaTooltip) && (
                          <p className="text-[11px] leading-relaxed px-2 py-1.5 rounded italic"
                            style={{ color: `${style.accent}cc`, backgroundColor: `${style.accent}0a`, border: `1px solid ${style.accent}22` }}>
                            {KARMA_DESC[activeKarmaTooltip]}
                          </p>
                        )}
                      </div>
                    )}
                    {/* 褪色印記 */}
                    {fadedTags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">褪色印記</span>
                        <div className="flex flex-wrap gap-2">
                          {fadedTags.map((kt, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveKarmaTooltip(activeKarmaTooltip === kt.tag ? null : kt.tag)}
                              className="text-xs px-2 py-0.5 rounded border transition-opacity"
                              style={{
                                borderColor: '#333',
                                color: '#555',
                                opacity: 0.4,
                                textDecoration: 'line-through',
                                backgroundColor: 'transparent',
                              }}
                            >
                              {kt.tag}
                            </button>
                          ))}
                        </div>
                        {/* 褪色印記描述提示框 */}
                        {activeKarmaTooltip && KARMA_DESC[activeKarmaTooltip] && fadedTags.some(t => t.tag === activeKarmaTooltip) && (
                          <p className="text-[11px] leading-relaxed px-2 py-1.5 rounded italic"
                            style={{ color: '#555', backgroundColor: '#ffffff08', border: '1px solid #333' }}>
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
                  <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">特殊狀態</span>
                  <div className="flex flex-wrap gap-2">
                    {userData.status_tags.map((st, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: '#1a1200',
                          color: '#fbbf24',
                          border: '1px solid #78350f',
                        }}
                      >
                        {st.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pets */}
              <div className="space-y-2">
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">
                  同行生物（{pets.length}/3）
                </span>
                {pets.length === 0 ? (
                  <div className="text-xs text-gray-700 italic">目前無同行生物。</div>
                ) : (
                  <div className="space-y-1.5">
                    {pets.map(pet => (
                      <div
                        key={pet.pet_id}
                        className="rounded border px-3 py-2"
                        style={{ borderColor: `${style.accent}22`, backgroundColor: `${style.accent}06` }}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            className="text-xs text-left hover:underline"
                            style={{ color: style.accent }}
                            onClick={() => setExpandedPet(expandedPet === pet.pet_id ? null : pet.pet_id)}
                          >
                            ▸ {pet.pet_name}
                          </button>
                          {targetOcName === currentUserOcName && (
                            <button
                              onClick={() => handleReleasePet(pet.pet_id, pet.pet_name)}
                              disabled={releasingPet === pet.pet_id}
                              className="text-[10px] text-gray-700 hover:text-red-500 transition-colors tracking-widest disabled:opacity-50"
                            >
                              {releasingPet === pet.pet_id ? '流放中...' : '[ 流放 ]'}
                            </button>
                          )}
                        </div>
                        {/* 個性與習慣標籤 */}
                        {(pet.personality || pet.habit) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pet.personality && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded border"
                                style={{
                                  borderColor: `${style.accent}30`,
                                  color: style.accent,
                                  opacity: 0.7,
                                }}
                              >
                                {pet.personality}
                              </span>
                            )}
                            {pet.habit && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded border"
                                style={{
                                  borderColor: `${style.accent}30`,
                                  color: style.accent,
                                  opacity: 0.7,
                                }}
                              >
                                {pet.habit}
                              </span>
                            )}
                          </div>
                        )}
                        {expandedPet === pet.pet_id && (
                          <p
                            className="mt-1.5 text-[11px] text-gray-400 border-t pt-1.5"
                            style={{ borderColor: `${style.accent}18` }}
                          >
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
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-600">見證紀錄</span>
                {witnessRecords.length === 0 ? (
                  <div className="text-xs text-gray-700 italic">尚無組隊見證紀錄。</div>
                ) : (
                  <div className="space-y-1">
                    {witnessRecords.map((rec, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-gray-400 px-2 py-1 border-l-2"
                        style={{ borderColor: `${style.accent}45` }}
                      >
                        <span style={{ color: style.accent }}>{rec.landmark_name}</span>
                        <span className="text-gray-700"> · Ch{rec.chapter_version} · </span>
                        <span className="text-gray-500">
                          {rec.members.filter(m => m !== targetOcName).join('、') || '（獨自見證）'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-2 border-t flex justify-between text-[10px] text-gray-800 tracking-widest"
          style={{ borderColor: `${style.accent}25` }}
        >
          <span>PROJECT TURBID DUST</span>
          <span>OBSERVER TERMINAL v1.0</span>
        </div>
      </div>
    </div>
  );
};
