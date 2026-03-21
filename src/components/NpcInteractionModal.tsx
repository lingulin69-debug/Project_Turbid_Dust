import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { UserData } from './ReportSystemLogic';
import { FACTION_THEMES } from './WhiteCrowCard';

// Types that should ideally be in a central types file
export interface NpcMapEntry {
  id: string;
  oc_name: string;
  display_name: string;
  npc_role: 'black_merchant' | 'trafficker' | 'inn_owner' | 'pet_merchant';
  is_open: boolean;
  status_text?: string;
}

export interface MarketSlot {
  id: string;
  seller_oc: string;
  item_id: string | null;
  item_type: string;
  custom_name: string | null;
  custom_description: string | null;
  price: number;
  listed_at: string;
  dice_type?: 'D6' | 'D20' | null;
  is_sold?: boolean;
}

export interface ShopPet {
  id: string;
  name: string;
  description: string;
  price: number;
  is_listed: boolean;
  is_preset: boolean;
}

const NPC_ROLE_ICON: Record<NpcMapEntry['npc_role'], string> = {
  black_merchant: '🎭',
  trafficker:     '🪤',
  inn_owner:      '🏠',
  pet_merchant:   '🐾',
};

const NPC_ROLE_LABEL: Record<NpcMapEntry['npc_role'], string> = {
  black_merchant: '黑心商人',
  trafficker:     '人販子',
  inn_owner:      '旅店老闆',
  pet_merchant:   '寵物商人',
};

interface NpcInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNpcId: string | null;
  currentUser: UserData | null;
  playerFaction: 'Turbid' | 'Pure' | 'Common';
  npcs: NpcMapEntry[];
  marketSlots: MarketSlot[];
  marketLoading: boolean;
  marketError: string;
  shopPets: ShopPet[];
  petsLoading: boolean;
  petsError: string;
  buyingSlotId: string | null;
  buyingPetId: string | null;
  handleBuyItem: (slot: MarketSlot) => Promise<void>;
  handleBuyPet: (pet: ShopPet) => Promise<void>;
  npcActionMsg: { type: 'ok' | 'err'; text: string } | null;
  npcActionLoading: boolean;
  innRescueTarget: string;
  setInnRescueTarget: (target: string) => void;
  handleInnHeal: (innOcName: string) => Promise<void>;
  handleInnRescue: (innOcName: string) => Promise<void>;
}

export const NpcInteractionModal: React.FC<NpcInteractionModalProps> = ({
  isOpen,
  onClose,
  selectedNpcId,
  currentUser,
  playerFaction,
  npcs,
  marketSlots,
  marketLoading,
  marketError,
  shopPets,
  petsLoading,
  petsError,
  buyingSlotId,
  buyingPetId,
  handleBuyItem,
  handleBuyPet,
  npcActionMsg,
  npcActionLoading,
  innRescueTarget,
  setInnRescueTarget,
  handleInnHeal,
  handleInnRescue,
}) => {
  if (!isOpen || !selectedNpcId) return null;

  const npc = npcs.find(n => n.id === selectedNpcId);
  if (!npc) return null;

  const wcTheme = FACTION_THEMES[playerFaction === 'Turbid' ? 'Turbid' : 'Pure'];

  const roleColor = npc.npc_role === 'black_merchant' ? '#ef4444'
    : npc.npc_role === 'trafficker'     ? '#d97706'
    : npc.npc_role === 'inn_owner'       ? '#0d9488'
    : '#9b59b6'; // pet_merchant

  const actionBtnStyle: React.CSSProperties = {
    border: `1px solid ${roleColor}70`,
    color: roleColor,
    backgroundColor: wcTheme.btnBg,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-[65] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(4,2,8,0.65)' }}
      onClick={onClose}
    >
      <div className="relative mx-4 w-full max-w-[420px]" onClick={e => e.stopPropagation()}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full rounded-lg overflow-hidden"
          style={{
            background: wcTheme.cardBg,
            border: `1px solid ${wcTheme.border}`,
            boxShadow: wcTheme.shadow,
            maxHeight: 'calc(100vh - 80px)',
          }}
        >
          <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)` }} />
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${wcTheme.tabBorder}` }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{NPC_ROLE_ICON[npc.npc_role]}</span>
              <div>
                <div className="text-[9px] tracking-[0.35em] font-mono mb-0.5 uppercase" style={{ color: roleColor }}>{NPC_ROLE_LABEL[npc.npc_role]}</div>
                <div className="text-sm font-bold tracking-wide" style={{ color: wcTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>
                  {npc.display_name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
                backgroundColor: npc.is_open ? 'rgba(34,197,94,0.12)' : wcTheme.itemBg,
                color: npc.is_open ? '#22c55e' : wcTheme.textMuted,
                border: `1px solid ${npc.is_open ? 'rgba(34,197,94,0.25)' : wcTheme.tabBorder}`,
              }}>
                {npc.is_open ? '● 營業' : '○ 休息'}
              </span>
              <motion.button
                whileHover={{ opacity: 0.7 }}
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                style={{
                  backgroundColor: wcTheme.closeBg,
                  border: `1px solid ${wcTheme.closeBorder}`,
                  color: wcTheme.closeIcon,
                }}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {npc.status_text && (
              <p className="text-[11px] font-mono mb-4 px-3 py-2 rounded-md border-l-2 italic"
                style={{ color: wcTheme.textSecondary, borderColor: roleColor, backgroundColor: wcTheme.itemBg }}>
                「{npc.status_text}」
              </p>
            )}

            {!npc.is_open ? (
              <div className="text-center py-8">
                <div className="text-xs italic" style={{ color: wcTheme.textMuted }}>
                  今日暫停服務，請稍後再來。
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(npc.npc_role === 'black_merchant' || npc.npc_role === 'item_merchant') && (
                  <div className="space-y-2">
                    {!currentUser ? (
                      <div className="text-center py-6 text-xs italic" style={{ color: wcTheme.textMuted }}>請先登入才能購買商品</div>
                    ) : marketLoading ? (
                      <div className="text-center py-6 text-xs" style={{ color: wcTheme.textMuted }}>
                        <span className="animate-pulse">載入商品中...</span>
                      </div>
                    ) : marketSlots.length === 0 ? (
                      <div className="text-center py-6 text-xs italic" style={{ color: wcTheme.textMuted }}>今日暫無商品</div>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {marketSlots.map(slot => (
                          <div key={slot.id}
                            className="flex items-center justify-between px-3 py-2.5 rounded-md transition-colors"
                            style={{ backgroundColor: wcTheme.itemBg, border: `1px solid ${wcTheme.tabBorder}` }}
                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = wcTheme.itemHoverBg}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = wcTheme.itemBg}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-mono truncate" style={{ color: wcTheme.textPrimary }}>
                                {slot.custom_name || slot.item_id || slot.item_type}
                              </div>
                              {slot.custom_description && (
                                <div className="text-[10px] mt-0.5 truncate" style={{ color: wcTheme.textSecondary }}>{slot.custom_description}</div>
                              )}
                              <div className="text-[10px] mt-0.5" style={{ color: roleColor, opacity: 0.8 }}>
                                {slot.item_type === 'dice_item' ? `🎲 ${slot.dice_type ?? 'D6'} 判定` : slot.item_type} · {slot.price} 幣
                              </div>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.94 }}
                              disabled={buyingSlotId === slot.id || (currentUser.coins ?? 0) < slot.price}
                              onClick={() => handleBuyItem(slot)}
                              className="text-xs px-3 py-1.5 ml-2 flex-shrink-0 disabled:opacity-30"
                              style={{ ...actionBtnStyle, whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${roleColor}20`; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = wcTheme.btnBg; }}
                            >
                              {buyingSlotId === slot.id ? '...' : `${slot.price}幣 購買`}
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    )}
                    {(npcActionMsg || marketError) && (
                      <div className="text-[11px] font-mono text-center px-3 py-2 rounded-md mt-1"
                        style={{
                          color: npcActionMsg?.type === 'ok' ? '#22c55e' : '#ef4444',
                          backgroundColor: npcActionMsg?.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${npcActionMsg?.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                        {npcActionMsg?.text || marketError}
                      </div>
                    )}
                  </div>
                )}
                {npc.npc_role === 'inn_owner' && (
                  <div className="space-y-2.5">
                  {!currentUser ? (
                    <div className="text-center py-6 text-xs italic" style={{ color: wcTheme.textMuted }}>請先登入才能使用旅店服務</div>
                  ) : (
                    <>
                      <div className="rounded-md p-3" style={{ backgroundColor: wcTheme.itemBg, border: `1px solid ${wcTheme.tabBorder}` }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-mono" style={{ color: roleColor }}>治療 HP</div>
                            <div className="text-[10px] mt-0.5" style={{ color: wcTheme.textSecondary }}>費用 2 幣 · D20 判定</div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            disabled={npcActionLoading || (currentUser.coins ?? 0) < 2}
                            onClick={() => handleInnHeal(npc.oc_name)}
                            className="text-xs px-3 py-1.5 disabled:opacity-30"
                            style={actionBtnStyle}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${roleColor}20`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = wcTheme.btnBg; }}
                          >
                            {npcActionLoading ? '...' : '申請治療'}
                          </motion.button>
                        </div>
                      </div>
                      <div className="rounded-md p-3 space-y-2" style={{ backgroundColor: wcTheme.itemBg, border: `1px solid ${wcTheme.tabBorder}` }}>
                        <div className="text-xs font-mono" style={{ color: roleColor }}>委託救援</div>
                        <div className="text-[10px]" style={{ color: wcTheme.textSecondary }}>費用 5 幣 · 輸入失蹤玩家 OC 名稱</div>
                        <div className="flex gap-2">
                          <input
                            value={innRescueTarget}
                            onChange={e => setInnRescueTarget(e.target.value)}
                            placeholder="OC 名稱"
                            className="flex-1 text-xs px-2 py-1.5 rounded focus:outline-none"
                            style={{
                              backgroundColor: wcTheme.inputBg,
                              border: `1px solid ${wcTheme.inputBorder}`,
                              color: wcTheme.inputColor,
                            }}
                            onFocus={e => { (e.currentTarget as HTMLInputElement).style.backgroundColor = wcTheme.inputFocusBg; }}
                            onBlur={e => { (e.currentTarget as HTMLInputElement).style.backgroundColor = wcTheme.inputBg; }}
                          />
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            disabled={!innRescueTarget.trim() || npcActionLoading || (currentUser.coins ?? 0) < 5}
                            onClick={() => handleInnRescue(npc.oc_name)}
                            className="text-xs px-3 py-1.5 flex-shrink-0 disabled:opacity-30"
                            style={actionBtnStyle}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${roleColor}20`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = wcTheme.btnBg; }}
                          >
                            {npcActionLoading ? '...' : '委託 5幣'}
                          </motion.button>
                        </div>
                      </div>
                      {npcActionMsg && (
                        <div className="text-[11px] font-mono text-center px-3 py-2 rounded-md"
                          style={{
                            color: npcActionMsg.type === 'ok' ? '#22c55e' : '#ef4444',
                            backgroundColor: npcActionMsg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${npcActionMsg.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                          }}>
                          {npcActionMsg.text}
                        </div>
                      )}
                    </>
                  )}
                  </div>
                )}
                {npc.npc_role === 'pet_merchant' && (
                  <div className="space-y-2">
                    {!currentUser ? (
                      <div className="text-center py-6 text-xs italic" style={{ color: wcTheme.textMuted }}>請先登入才能購買同行生物</div>
                    ) : petsLoading ? (
                      <div className="text-center py-6 text-xs" style={{ color: wcTheme.textMuted }}>
                        <span className="animate-pulse">載入中...</span>
                      </div>
                    ) : shopPets.length === 0 ? (
                      <div className="text-center py-6 text-xs italic" style={{ color: wcTheme.textMuted }}>今日暫無可購買的同行生物</div>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {shopPets.map(pet => (
                          <div key={pet.id}
                            className="flex items-center justify-between px-3 py-2.5 rounded-md transition-colors"
                            style={{ backgroundColor: wcTheme.itemBg, border: `1px solid ${wcTheme.tabBorder}` }}
                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = wcTheme.itemHoverBg}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = wcTheme.itemBg}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-mono truncate" style={{ color: wcTheme.textPrimary }}>{pet.name}</div>
                              {pet.description && (
                                <div className="text-[10px] mt-0.5 truncate" style={{ color: wcTheme.textSecondary }}>{pet.description}</div>
                              )}
                              <div className="text-[10px] mt-0.5" style={{ color: roleColor, opacity: 0.8 }}>{pet.price} 幣</div>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.94 }}
                              disabled={buyingPetId === pet.id || (currentUser.coins ?? 0) < pet.price}
                              onClick={() => handleBuyPet(pet)}
                              className="text-xs px-3 py-1.5 ml-2 flex-shrink-0 disabled:opacity-30"
                              style={{ ...actionBtnStyle, whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${roleColor}20`; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = wcTheme.btnBg; }}
                            >
                              {buyingPetId === pet.id ? '...' : `${pet.price}幣 購買`}
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    )}
                    {(npcActionMsg || petsError) && (
                      <div className="text-[11px] font-mono text-center px-3 py-2 rounded-md mt-1"
                        style={{
                          color: npcActionMsg?.type === 'ok' ? '#22c55e' : '#ef4444',
                          backgroundColor: npcActionMsg?.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${npcActionMsg?.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                        {npcActionMsg?.text || petsError}
                      </div>
                    )}
                  </div>
                )}
                {npc.npc_role === 'trafficker' && (
                  <div className="text-center py-8">
                    <div className="text-xs italic" style={{ color: wcTheme.textSecondary }}>
                      此人在暗處注視著你。
                    </div>
                    <div className="text-[10px] font-mono mt-2" style={{ color: wcTheme.textMuted }}>
                      [ 僅 NPC 玩家可操作技能 ]
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="px-5 py-2 flex justify-end text-[9px] tracking-widest font-mono"
            style={{ borderTop: `1px solid ${wcTheme.tabBorder}`, color: wcTheme.textMuted, opacity: 0.5 }}>
            NPC · {npc.oc_name}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
