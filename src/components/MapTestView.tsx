import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserData, loginOrRegister, syncUserData, MAX_INVENTORY_SIZE } from './ReportSystemLogic';
import { useGesture } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  ScrollText, 
  BookOpen, 
  Backpack, 
  CalendarDays, 
  Coins, 
  User,
  Settings,
  X,
  Scale,
  Volume2,
  VolumeX,
  Music,
  Shirt,
  Puzzle,
  Hourglass,
  Plus,
  Minus,
  Feather,
  Heart,
  Activity,
  Wrench,
  Crown,
} from 'lucide-react';
import { ApostateSystem, ApostateGeometryIcon } from './ApostateSystem';
import { AdminApostateControl } from './AdminApostateControl';
import { LiquidatorSystem, LiquidatorLensIcon } from './LiquidatorSystem';
import { DevControlPanel } from './DevControlPanel';

import { MapLandmark, LandmarkData, LandmarkType } from './MapLandmark';
import { CentralBalanceScale } from './CentralBalanceScale';
import { DraggableUIButton } from './DraggableUIButton';
import { DesignOverlay } from './DesignOverlay';
import { LoginModal } from './auth/LoginModal';
import { FACTION_COLORS } from '@/lib/constants';
import { useGlobalBalance } from '@/hooks/useGlobalBalance';
import { useGazette } from '@/hooks/useGazette';
import { useNotifications } from '@/hooks/useNotifications';
import { apiClient } from '@/api/client';
import { CharacterCard } from './CharacterCard';
import { NPCPanel } from './NPCPanel';
import { LeaderTyrannyPanel } from './LeaderTyrannyPanel';
import { BalanceSettlementModal } from './BalanceSettlementModal';
import { WhiteCrowCard, FACTION_THEMES } from './WhiteCrowCard';
import {
  AnnouncementPanel,
  QuestPanel,
  DailyPanel,
  CollectionPanel,
  SettingsPanel,
} from './WhiteCrowPanels';
import { PTD_UI_THEME, PTD_UI_TURBID_THEME, getPageTheme, usePTDUIStyles } from './PTD_UI_Theme';
import { Sounds } from '@/hooks/useSounds';
import landmarkChaptersData from '@/data/landmark-chapters.json';

// Extended Landmark Interface
interface Landmark extends LandmarkData {
  // Inherits from LandmarkData
}

// ── NPC 地圖實體 ──────────────────────────────────────────────────────────────
interface NpcMapEntry {
  id: string;
  oc_name: string;       // 對應 td_users.oc_name
  display_name: string;  // 顯示名稱
  npc_role: 'black_merchant' | 'trafficker' | 'inn_owner' | 'pet_merchant';
  x: number;             // 百分比 0-100
  y: number;
  is_open: boolean;      // 目前是否營業
  status_text?: string;  // NPC 自訂狀態訊息
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

// 固定位置 NPC（inn_owner / pet_merchant / black_merchant / item_merchant）
// 座標由管理員在此設定，不會改變
// 人販子（trafficker）不在此列，位置由 current_landmark_id 動態決定
const MAP_NPCS: NpcMapEntry[] = [
  { id: 'npc_bm1',  oc_name: 'BlackMerchantA', display_name: '老黑',     npc_role: 'black_merchant', x: 32, y: 55, is_open: true,  status_text: '今日開張，稀有貨不多' },
  { id: 'npc_inn1', oc_name: 'InnOwnerA',      display_name: '暖光旅店', npc_role: 'inn_owner',      x: 68, y: 35, is_open: true,  status_text: '今日接受治療與救援' },
  { id: 'npc_pm1',  oc_name: 'PetMerchantA',   display_name: '獸語人',   npc_role: 'pet_merchant',   x: 82, y: 60, is_open: false, status_text: '今日休息' },
];

// Updated Data with Types
const landmarks: Landmark[] = [
  { id: 'l1_t01', name: '空衣街區', x: 20, y: 40, faction: 'Turbid', status: 'open', occupants: 2, capacity: 5, type: 'town' },
  { id: 'l1_t04', name: '舊鐘樓觀測所', x: 45, y: 30, faction: 'Turbid', status: 'open', occupants: 0, capacity: 3, type: 'school' },
  { id: 'l1_p01', name: '淨化尖塔', x: 75, y: 50, faction: 'Pure', status: 'open', occupants: 5, capacity: 10, type: 'church' },
  { id: 'l1_p02', name: '中央圖書館', x: 60, y: 65, faction: 'Pure', status: 'open', occupants: 1, capacity: 8, type: 'school' },
];

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

const announcements: Announcement[] = [
  { 
    id: 'a1', 
    title: '觀測日誌 · 殘篇 I', 
    content: '紀錄於時光之隙的殘篇... 濁息濃度今日異常上升，請觀測者們遠離邊界迷霧。唯有保持理智，方能直視深淵而不被吞噬。', 
    date: '2026.02.08' 
  },
  { 
    id: 'a2', 
    title: '系統公告 · 靜默協議', 
    content: '終端將於近期進行乙太重組。屆時所有連接將暫時斷開，請觀測者們尋找安全據點避難。', 
    date: '2026.02.07' 
  },
  {
    id: 'a3',
    title: '緊急通報 · 雙生鏡像',
    content: '警告：在鏡像邊界觀測到不明數據波動。請勿相信任何非本陣營的訊號...它們可能是來自深淵的誘餌。',
    date: '2026.02.06'
  }
];

interface Mission {
  id: string;
  title: string;
  description: string;
  current: number;
  max?: number; // Optional for side quests
  status: 'active' | 'full';
  faction: 'Turbid' | 'Pure' | 'Common';
  type: 'main' | 'side';
  chapterVersion: string;
}

interface MarketSlot {
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

interface ShopPet {
  id: string;
  name: string;
  description: string;
  price: number;
  is_listed: boolean;
  is_preset: boolean;
}

const missions: Mission[] = [
  { 
    id: 'm1', 
    title: '重塑破碎的黃昏', 
    description: '收集散落在邊界的微光碎片，修復舊觀測站的能源核心。', 
    current: 1, 
    max: 3, 
    status: 'active', 
    faction: 'Turbid',
    type: 'main',
    chapterVersion: '1.0'
  },
  { 
    id: 'm2', 
    title: '淨化儀式 · 序章', 
    description: '前往中央圖書館協助整理受污染的古籍。', 
    current: 3, 
    max: 3, 
    status: 'full', 
    faction: 'Pure',
    type: 'main',
    chapterVersion: '1.0'
  },
  { 
    id: 'm3', 
    title: '收集濁息殘片', 
    description: '在空衣街區尋找殘留的濁息結晶。', 
    current: 42, 
    status: 'active', 
    faction: 'Common',
    type: 'side',
    chapterVersion: '1.0'
  }
];


// ─── KidnapPopup ────────────────────────────────────────────────────────────
interface KidnapPopupProps {
  notification: { id: string; content: string };
  lostUntil: string | null;
  onMarkRead: () => void;
  onOpenCharacterCard: () => void;
}

const KidnapPopup: React.FC<KidnapPopupProps> = ({
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Atmospheric noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
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
// ─── End KidnapPopup ─────────────────────────────────────────────────────────

// ── 骰子判定動畫 Overlay ──────────────────────────────────────────────────────
interface DiceAnimData {
  dice_type: 'D6' | 'D20';
  result: number;
  message: string;
  coins_delta: number;
  status_tag: string;
}

const DiceResultOverlay: React.FC<{ data: DiceAnimData; onClose: () => void }> = ({ data, onClose }) => {
  const [displayed, setDisplayed] = React.useState(1);
  const [settled, setSettled] = React.useState(false);
  const max = data.dice_type === 'D20' ? 20 : 6;

  React.useEffect(() => {
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
  }, []);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(4,2,8,0.88)', backdropFilter: 'blur(4px)' }}
    >
      <div className="flex flex-col items-center gap-6 select-none">
        {/* 標題 */}
        <p className="font-mono tracking-[0.5em] uppercase" style={{ fontSize: 9, color: '#5a4a30' }}>
          {data.dice_type} · 判定結果
        </p>

        {/* 骰子面 */}
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

        {/* 結果文字（settled 後顯示） */}
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

export const MapTestView: React.FC = () => {
  usePTDUIStyles();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [playerFaction, setPlayerFaction] = useState<'Turbid' | 'Pure' | 'Common'>('Common');  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(true); // Default true for Gatekeeper
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // Compendium State
  const [collectionTab, setCollectionTab] = useState<'raiment' | 'fragments' | 'relics'>('raiment');
  
  // Daily Log State
  const [dailyTab, setDailyTab] = useState<'echoes' | 'snippets'>('echoes');
  const [dailySnippets, setDailySnippets] = useState([
    { id: 's1', content: '今天在街角看到一隻發光的貓，它似乎不受濁息影響。', likes: 12, isLiked: false },
    { id: 's2', content: '自動販賣機吞了我的最後一枚硬幣...這也是混沌的意志嗎？', likes: 5, isLiked: false },
    { id: 's3', content: '觀測站的咖啡機修好了，這是本週最好的消息。', likes: 28, isLiked: false },
  ]);

  // Settings State
  const [bgmVolume, setBgmVolume] = useState(50);
  const [sfxVolume, setSfxVolume] = useState(80);

  // Drift Bottle (Lost Fragments) State — 持久化由 useDriftFragments 處理
  const [isDriftMode, setIsDriftMode] = useState(false);
  const [driftMessage, setDriftMessage] = useState<string[]>([]);
  const [driftModalOpen, setDriftModalOpen] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState<{id: string, content: string, sender: string} | null>(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [partyJoinLoading, setPartyJoinLoading] = useState(false);
  const [partyJoinResult, setPartyJoinResult] = useState<'success' | 'full' | 'already' | 'error' | null>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [traffickerEntries, setTraffickerEntries] = useState<NpcMapEntry[]>([]);

  // 人販子動態位置：從 Supabase 讀取 current_landmark_id，對應到地圖座標
  useEffect(() => {
    const fetchTraffickerPositions = async () => {
      try {
        const { data } = await (supabase as any)
          .from('td_users')
          .select('oc_name, current_landmark_id, is_in_party, npc_status_text')
          .eq('npc_role', 'trafficker');
        if (!data) return;
        const entries: NpcMapEntry[] = data
          .filter((t: any) => t.current_landmark_id)
          .map((t: any) => {
            const lm = landmarks.find(l => l.id === t.current_landmark_id);
            if (!lm) return null;
            return {
              id: `tf_${t.oc_name}`,
              oc_name: t.oc_name,
              display_name: t.oc_name,
              npc_role: 'trafficker' as const,
              x: lm.x + 3, // 稍微偏移避免與據點 ICON 重疊
              y: lm.y - 4,
              is_open: true,
              status_text: t.npc_status_text || undefined,
            };
          })
          .filter(Boolean) as NpcMapEntry[];
        setTraffickerEntries(entries);
      } catch { /* 靜默失敗 */ }
    };
    fetchTraffickerPositions();
  }, []);

  // NPC 商店資料：點擊 NPC 圖標時自動載入對應商品（按 seller_oc 篩選）
  useEffect(() => {
    setMarketSlots([]);
    setShopPets([]);
    setNpcActionMsg(null);
    setMarketError('');
    setPetsError('');
    setInnRescueTarget('');
    if (!selectedNpcId || !currentUser) return;
    const npc = [...MAP_NPCS, ...traffickerEntries].find(n => n.id === selectedNpcId);
    if (!npc || !npc.is_open) return;
    if (npc.npc_role === 'black_merchant' || npc.npc_role === 'item_merchant') {
      setMarketLoading(true);
      setMarketError('');
      (async () => {
        try {
          const data = await apiClient.npc.merchant.getMarket(CURRENT_CHAPTER);
          const filtered = (Array.isArray(data) ? data : [])
            .filter((i: any) => i.seller_oc === npc.oc_name && !i.is_sold);
          setMarketSlots(filtered);
        } catch { setMarketError('商品載入失敗'); }
        finally { setMarketLoading(false); }
      })();
    } else if (npc.npc_role === 'pet_merchant') {
      fetchPets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNpcId]);

  const wordBank = ['遺忘', '霧中', '鐘聲', '等待', '微光', '廢墟', '回響', '深淵', '重逢', '破碎', '時間', '雨聲', '沉默', '歸途', '星辰', '灰燼'];

  // Mission & Reporting State
  const [questTab, setQuestTab] = useState<'recruitment' | 'reporting'>('recruitment');
  const [reportSubject, setReportSubject] = useState('');
  const [isLocked, setIsLocked] = useState(false); // 報名鎖定機制 (已參與但未回報)
  const [hasReportedMain, setHasReportedMain] = useState(false); // 是否已完成當前版本主線回報
  const [missionLockId, setMissionLockId] = useState<string | null>(null);
  const [marketSlots, setMarketSlots] = useState<MarketSlot[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');
  const [buyingSlotId, setBuyingSlotId] = useState<string | null>(null);
  const [shopPets, setShopPets] = useState<ShopPet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState('');
  const [buyingPetId, setBuyingPetId] = useState<string | null>(null);

  // NPC 互動 Modal 狀態
  const [npcActionMsg, setNpcActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [npcActionLoading, setNpcActionLoading] = useState(false);
  const [innRescueTarget, setInnRescueTarget] = useState('');
  const [diceAnimState, setDiceAnimState] = useState<DiceAnimData | null>(null);

  // Breathing Icon State (Performance Optimized)
  const [hasUnclaimedGift, setHasUnclaimedGift] = useState(false);
  const CURRENT_CHAPTER = '1.0';
  const CHAPTER_TAG = `ch${CURRENT_CHAPTER.split('.')[0]}`;
  const DEFAULT_MISSION_LOCK_ID = `main_${CHAPTER_TAG}_m1`;
  
  // Exhale (Gift Giving) State
  const [exhaleModalOpen, setExhaleModalOpen] = useState(false);
  const [selectedExhaleItem, setSelectedExhaleItem] = useState<string | null>(null);
  const [exhaleMessage, setExhaleMessage] = useState('');

  // Character Card State
  const [characterCardTarget, setCharacterCardTarget] = useState<string | null>(null);

  // Notification State
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Apostate System State
  const [apostateMenuOpen, setApostateMenuOpen] = useState(false);
  const [liquidatorMenuOpen, setLiquidatorMenuOpen] = useState(false);
  
  // 2. 天平核心 — 改由 Supabase global_stats 即時同步
  const { balance: balanceWeight, updateBalance } = useGlobalBalance();

  // Drift Bottle 即時同步 hook
  

  // 小道消息 — 即時同步
  const { entries: gazetteEntries, loading: gazetteLoading } = useGazette('ch01_v3', 50);

  // 通知系統 — 即時同步
  const { notifications, unreadCount, popupNotification, markRead, markAllRead } = useNotifications(
    currentUser?.oc_name ?? null
  );

  // Breathing Gift Items (Limited List)
  

  // Check for unclaimed gifts on mount or login
  useEffect(() => {
    if (currentUser) {
       // Mock check logic
       const claimed = localStorage.getItem(`gift_claimed_${currentUser.oc_name}_${CURRENT_CHAPTER}`);
       setHasUnclaimedGift(!claimed);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const storageKey = `mission_lock_${currentUser.oc_name}_${CURRENT_CHAPTER}`;
    const storedLockId = localStorage.getItem(storageKey) || DEFAULT_MISSION_LOCK_ID;
    setMissionLockId(storedLockId);
    apiClient.mission
      .lock(currentUser.oc_name, storedLockId, CURRENT_CHAPTER, 'check')
      .then(result => {
        setIsLocked(result.locked);
        setHasReportedMain(result.reported);
      })
      .catch(() => {});
  }, [currentUser, DEFAULT_MISSION_LOCK_ID, CURRENT_CHAPTER]);

  

  

  // Close modals on backdrop click
  useEffect(() => {
    const handleBackdropClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (activeTab && target.classList.contains('modal-backdrop')) {
        setActiveTab(null);
      }
    };
    window.addEventListener('click', handleBackdropClick);
    return () => window.removeEventListener('click', handleBackdropClick);
  }, [activeTab]);

  const handleLikeSnippet = async (id: string) => {
    setDailySnippets(prev => prev.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          likes: s.isLiked ? s.likes - 1 : s.likes + 1,
          isLiked: !s.isLiked 
        };
      }
      return s;
    }));
    console.log(`[DB Sync] Updated likes for snippet ${id}`);
  };

  const handleMissionJoin = async (mission: Mission) => {
    if (!currentUser) return;
    if (mission.type === 'side') {
      alert(`已加入支線任務：${mission.title}。請前往現場進行支援。`);
      return;
    }

    if (hasReportedMain) {
      alert('本章節的主線回報已記錄。命運的齒輪暫時靜止，請等待下一次版本更新。');
      return;
    }

    if (isLocked) {
      alert('命運的齒輪已卡死，在下一次雨落前，您無法再承擔新的宿命。\n(請先完成並回報當前進行中的任務)');
      return;
    }

    try {
      const lockId = `${mission.type}_${CHAPTER_TAG}_${mission.id}`;
      setMissionLockId(lockId);
      localStorage.setItem(`mission_lock_${currentUser.oc_name}_${CURRENT_CHAPTER}`, lockId);
      const result = await apiClient.mission.lock(currentUser.oc_name, lockId, CURRENT_CHAPTER, 'lock');
      if (result.reported) {
        setHasReportedMain(true);
        alert('本章節的主線回報已記錄。命運的齒輪暫時靜止，請等待下一次版本更新。');
        return;
      }
      setIsLocked(result.locked);
      if (result.locked) {
        alert('已加入主線任務。系統已鎖定您的參與權限，請前往「回報任務」頁面提交進度。');
      }
    } catch (err: any) {
      alert(`鎖定失敗：${err.message || '請稍後再試'}`);
    }
  };

  const handleReportSubmit = async (subjectParam?: string) => {
    if (!currentUser) return;
    const subject = (subjectParam ?? reportSubject).trim();

    if (!subject) {
      alert('請填寫回報主旨。');
      return;
    }

    if (!/^.+-.+-.+$/.test(subject)) {
      alert('格式錯誤：請依照「章節-據點名稱-OC名稱」格式填寫。\n範例：第一章-荒原裂隙-塞理安');
      return;
    }

    try {
      // 呼叫後端：server-side 每日上限驗證 + 持久化 mission_logs
      const lockId = missionLockId || DEFAULT_MISSION_LOCK_ID;
      const result = await apiClient.mission.report(currentUser.oc_name, lockId, subject, CURRENT_CHAPTER, lockId);
      const authority = playerFaction === 'Turbid' ? '眾議會' : '教會';
      const earned = result.coins_earned ?? result.reward ?? 0;
      const newCoins = result.coins_total ?? result.new_coins ?? currentUser.coins;

      setCurrentUser(prev => prev ? ({
        ...prev,
        coins: newCoins,
        daily_coin_earned: result.weekly_coin_earned ?? (prev.daily_coin_earned || 0) + earned
      }) : null);

      alert(result.message || `『命運的齒輪再次轉動...』\n(獲得 +${earned} 貨幣，等待${authority}核對)`);
    } catch (err: any) {
      alert(`回報失敗：${err.message || '請稍後再試'}`);
      return;
    }

    setReportSubject('');
    setIsLocked(false);
    setHasReportedMain(true);
  };

  const fetchMarket = useCallback(async () => {
    if (!currentUser) return;
    setMarketLoading(true);
    setMarketError('');
    try {
      const data = await apiClient.npc.merchant.getMarket(CURRENT_CHAPTER);
      setMarketSlots(data || []);
    } catch (err: any) {
      setMarketError(err.message || '市集載入失敗');
    } finally {
      setMarketLoading(false);
    }
  }, [currentUser, CURRENT_CHAPTER]);

  const fetchPets = useCallback(async () => {
    if (!currentUser) return;
    setPetsLoading(true);
    setPetsError('');
    try {
      const res = await fetch(`${API_BASE}/pets/all`);
      if (!res.ok) throw new Error('寵物列表載入失敗');
      const data = (await res.json()) as ShopPet[];
      setShopPets((data || []).filter(p => p.is_listed));
    } catch (err: any) {
      setPetsError(err.message || '寵物列表載入失敗');
    } finally {
      setPetsLoading(false);
    }
  }, [currentUser]);

  const handleBuyItem = async (slot: MarketSlot) => {
    if (!currentUser) return;
    if ((slot.item_type !== 'outfit' && slot.item_type !== 'r18' && slot.item_type !== 'pet_preset' && slot.item_type !== 'pet_special') && (currentUser.inventory || []).length >= MAX_INVENTORY_SIZE) {
      setMarketError('背包已滿，無法購買更多商品');
      return;
    }
    setBuyingSlotId(slot.id);
    setMarketError('');
    setNpcActionMsg(null);
    try {
      const result = await apiClient.npc.merchant.buy(currentUser.oc_name, slot.id, CURRENT_CHAPTER);
      setCurrentUser(prev => {
        if (!prev) return prev;
        const nextInventory = result.item
          ? [...(prev.inventory || []), result.item]
          : prev.inventory || [];
        const wardrobeEntry = {
          slot_id: slot.id,
          item_id: slot.item_id,
          name: slot.custom_name || slot.item_id || '未知衣裝',
          acquired_at: new Date().toISOString(),
        };
        const nextWardrobe = result.wardrobe_updated
          ? [...(prev.wardrobe || []), wardrobeEntry]
          : prev.wardrobe;
        return {
          ...prev,
          coins: result.coins_remaining ?? result.new_coins,
          inventory: nextInventory,
          wardrobe: nextWardrobe
        };
      });
      fetchMarket();
      // 骰子判定商品：若 API 回傳骰子結果則觸發動畫
      if (slot.item_type === 'dice_item') {
        const diceRolled: number | undefined = result.item?.dice_rolled ?? result.item?.rolled ?? (result as any).dice_rolled;
        if (diceRolled !== undefined) {
          setDiceAnimState({
            dice_type: slot.dice_type ?? 'D6',
            result: diceRolled,
            message: result.item?.result_message ?? result.item?.message ?? result.message ?? '',
            coins_delta: result.item?.coins_delta ?? 0,
            status_tag: result.item?.status_tag ?? '',
          });
        } else {
          setNpcActionMsg({ type: 'ok', text: result.message || '購買成功' });
        }
      } else {
        setNpcActionMsg({ type: 'ok', text: `購買成功：${result.item?.custom_name || result.item_type}` });
      }
    } catch (err: any) {
      setMarketError(err.message || '購買失敗');
      setNpcActionMsg({ type: 'err', text: err.message || '購買失敗' });
    } finally {
      setBuyingSlotId(null);
    }
  };

  const handleBuyPet = async (pet: ShopPet) => {
    if (!currentUser) return;
    setBuyingPetId(pet.id);
    setPetsError('');
    setNpcActionMsg(null);
    try {
      const result = await apiClient.pets.buy(currentUser.oc_name, pet.id, CURRENT_CHAPTER);
      setCurrentUser(prev => prev ? ({ ...prev, coins: result.coins_remaining ?? result.new_coins }) : prev);
      fetchPets();
      setNpcActionMsg({ type: 'ok', text: result.message || `成功購得 ${pet.name}！` });
    } catch (err: any) {
      setPetsError(err.message || '購買失敗');
      setNpcActionMsg({ type: 'err', text: err.message || '購買失敗' });
    } finally {
      setBuyingPetId(null);
    }
  };

  const handleInnHeal = async (innOcName: string) => {
    if (!currentUser) return;
    setNpcActionLoading(true);
    setNpcActionMsg(null);
    try {
      const diceRoll = Math.floor(Math.random() * 20) + 1;
      const result = await apiClient.npc.inn.heal(innOcName, currentUser.oc_name, diceRoll);
      setCurrentUser(prev => prev ? { ...prev, hp: result.new_hp, coins: (prev.coins ?? 0) - 2 } : prev);
      setNpcActionMsg({ type: 'ok', text: `骰出 D20 = ${diceRoll}，回復 ${result.healed_amount} HP，HP 回至 ${result.new_hp}` });
    } catch (err: any) {
      setNpcActionMsg({ type: 'err', text: err.message || '治療失敗' });
    } finally {
      setNpcActionLoading(false);
    }
  };

  const handleInnRescue = async (innOcName: string) => {
    if (!currentUser || !innRescueTarget.trim()) return;
    setNpcActionLoading(true);
    setNpcActionMsg(null);
    try {
      const result = await apiClient.npc.inn.rescue(innOcName, innRescueTarget.trim());
      setCurrentUser(prev => prev ? { ...prev, coins: (prev.coins ?? 0) - 5 } : prev);
      setInnRescueTarget('');
      setNpcActionMsg({ type: 'ok', text: result.message || '救援委託已提交' });
    } catch (err: any) {
      setNpcActionMsg({ type: 'err', text: err.message || '委託失敗' });
    } finally {
      setNpcActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'inventory') return;
    if (!currentUser) return;
    fetchMarket();
    fetchPets();
  }, [activeTab, currentUser, fetchMarket]);

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isDriftMode || !currentUser) return;
    
    if (currentUser.coins < 5) {
      alert('您的行囊太輕，不足以承載這段訊息的重量。');
      return;
    }

    setDriftModalOpen(true);
  };

  

  const handleWordSelect = (word: string) => {
    if (driftMessage.length >= 5) return;
    setDriftMessage(prev => [...prev, word]);
  };

  const handleFragmentClick = (frag: {id: string, content: string, sender: string}, e?: React.MouseEvent | null) => {
    e?.stopPropagation();
    setSelectedFragment({ id: frag.id, content: frag.content, sender: frag.sender });
  };

  // Login Inputs
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [pendingOcName, setPendingOcName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setPasswordError, setSetPasswordError] = useState('');
  
  // --- Map Interaction State (Pinch & Zoom) ---
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dev Mode State
  const [isDevMode, setIsDevMode] = useState(false);
  const [geometryPos, setGeometryPos] = useState({ x: 50, y: 50 }); // percentage
  const [liquidatorPos, setLiquidatorPos] = useState({ x: 50, y: 50 }); // percentage
  const [lastReleasedPos, setLastReleasedPos] = useState<{name: string, x: number | string, y: number | string} | null>(null);
  const [dynamicLandmarks, setDynamicLandmarks] = useState(landmarks);

  const [inhalePos, setInhalePos] = useState({ x: 0, y: 0 });
  const [exhalePos, setExhalePos] = useState({ x: 0, y: 0 });
  const [driftTogglePos, setDriftTogglePos] = useState({ x: 0, y: 0 });
  const [zoomControlsPos, setZoomControlsPos] = useState({ x: 0, y: 0 });
  const [navPositions, setNavPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [showSettlement, setShowSettlement] = useState(false);
  const [fogButtonPos, setFogButtonPos] = useState({ x: 0, y: 0 });
  const [fogActive, setFogActive] = useState(true);
  const [fogDispersing, setFogDispersing] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayOffset, setOverlayOffset] = useState({ x: 0, y: 0 });
  const [overlayBtnPos, setOverlayBtnPos] = useState({ x: 0, y: 0 });
  
  // Dev Control Panel State
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);

  // --- Helper Functions for DEV Mode ---
  
  // Dev Panel Helpers
  const getDevItems = () => {
    const items = [];
    
    // Landmarks
    dynamicLandmarks.forEach(l => {
       items.push({ id: l.id, name: l.name, x: l.x, y: l.y, type: 'landmark' as const });
    });

    // Nav Buttons
    ['announcement', 'quest', 'daily', 'collection', 'inventory', 'settings'].forEach(id => {
       const pos = navPositions[id] || { x: 0, y: 0 };
       items.push({ id, name: `${id} Button`, x: pos.x, y: pos.y, type: 'ui' as const });
    });

    // Special Icons
    
    items.push({ id: 'zoom', name: 'Zoom Controls', x: zoomControlsPos.x, y: zoomControlsPos.y, type: 'ui' as const });
    items.push({ id: 'overlay', name: 'Overlay Toggle', x: overlayBtnPos.x, y: overlayBtnPos.y, type: 'ui' as const });

    return items;
  };

  const handleDevUpdate = (id: string, x: number | string, y: number | string) => {
    // 1. Landmarks
    const landmarkMatch = dynamicLandmarks.find(l => l.id === id);
    if (landmarkMatch) {
       setDynamicLandmarks(prev => prev.map(l => l.id === id ? { ...l, x: Number(x), y: Number(y) } : l));
       return;
    }

    // 2. Nav Buttons
    if (['announcement', 'quest', 'daily', 'collection', 'inventory', 'settings'].includes(id)) {
       setNavPositions(prev => ({ ...prev, [id]: { x: Number(x), y: Number(y) } }));
       return;
    }

    // 3. Special Icons
    if (id === 'zoom') setZoomControlsPos({ x: Number(x), y: Number(y) });
    if (id === 'overlay') setOverlayBtnPos({ x: Number(x), y: Number(y) });
  };

  // --- Use Gesture for Drag & Pinch (Map Movement) ---
  // Using native browser pinch-zoom is often smoother for mobile, but we want custom control
  // to clamp bounds and add UI layers that don't zoom.
  // So we use useGesture to update transform of the map container.

  const bind = useGesture({
    onDrag: ({ offset: [dx, dy] }) => {
      // Clamp position? Optional. For now let it flow.
      setPosition({ x: dx, y: dy });
    },
    onPinch: ({ offset: [d] }) => {
      setScale(1 + d / 200);
    },
    onWheel: ({ delta: [, dy] }) => {
      // Mouse wheel zoom
      setScale(s => Math.min(3, Math.max(0.5, s - dy * 0.001)));
    }
  }, {
    drag: { 
      from: () => [position.x, position.y],
      filterTaps: true 
    },
    pinch: { 
      scaleBounds: { min: 0.5, max: 3 }, 
      rubberband: true 
    },
    wheel: {
      eventOptions: { passive: false } // Important for preventing default scroll
    }
  });

  // Login Handler
  const handleLogin = async (username: string, pass: string) => {
    if (!username.trim() || !pass.trim()) {
      alert('請輸入完整的身分驗證資訊。');
      return;
    }

    const result = await loginOrRegister(username, pass);
    if (result.success && result.user) {
      setCurrentUser(result.user as any);
      setPlayerFaction(result.user.faction as 'Turbid' | 'Pure');
      setIsAdmin((result.user.oc_name || '').toLowerCase() === 'vonn');
      setShowLogin(false);
    } else if ((result as any).firstLogin) {
      // 首次登入：密碼仍為 '0000'，導向設定密碼流程
      setPendingOcName(username);
      setShowLogin(false);
      setShowSetPassword(true);
    } else {
      alert(result.message || 'Login failed');
    }
  };

  // Set Password Handler（首次登入）
  const handleSetPassword = async () => {
    setSetPasswordError('');
    if (!/^\d{4}$/.test(newPassword)) {
      setSetPasswordError('密碼必須為四位數字。');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSetPasswordError('兩次輸入的密碼不一致。');
      return;
    }
    try {
      const { apiClient } = await import('../api/client');
      await apiClient.auth.setPassword(pendingOcName, newPassword);
      // 密碼設定成功，用新密碼登入
      const result = await loginOrRegister(pendingOcName, newPassword);
      if (result.success && result.user) {
        setCurrentUser(result.user as any);
        setPlayerFaction(result.user.faction as 'Turbid' | 'Pure');
        setIsAdmin((result.user.oc_name || '').toLowerCase() === 'vonn');
        setShowSetPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setPendingOcName('');
      } else {
        setSetPasswordError('密碼設定成功，但登入失敗，請重新登入。');
      }
    } catch (err: any) {
      setSetPasswordError(err.message || '設定失敗，請稍後再試。');
    }
  };

  const getCurrencyIcon = () => {
    return Coins;
  };

  const getCurrencyName = () => {
    return '貨幣';
  };

  // 判斷是否可見 (Fog of War Logic)
  const isVisible = React.useCallback((targetFaction: string) => {
    if (isAdmin) return true;
    if (targetFaction === 'Common') return true;
    // Common 玩家邏輯：顯示模糊輪廓但不顯示詳細資訊 (或隱藏)
    if (playerFaction === 'Common') return false;
    return playerFaction === targetFaction;
  }, [isAdmin, playerFaction]);

  // 全頁主題：依陣營切換淺色(Pure) / 深色(Turbid)
  const pageTheme = getPageTheme(playerFaction);

  return (
    <div
      className="w-full h-screen overflow-hidden relative ptd-ui-base"
      data-faction={playerFaction}
      style={{ backgroundColor: pageTheme.bgBase, color: pageTheme.textPrimary }}
      ref={containerRef}
    >
      
      {/* Dev Control Panel */}
      <AnimatePresence>
        {isDevMode && (
          <DevControlPanel
            items={getDevItems()}
            selectedId={selectedDevId}
            onSelect={setSelectedDevId}
            onUpdate={handleDevUpdate}
            onClose={() => setIsDevMode(false)}
          />
        )}
      </AnimatePresence>

      {/* 🎲 骰子預覽按鈕（Dev 用，上線前移除） */}
      {isDevMode && (
        <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
          <button
            onClick={() => setDiceAnimState({ dice_type: 'D6', result: 5, message: '藥效強烈，但副作用也隨之而來...', coins_delta: 0, status_tag: '鼻挺中 ✦' })}
            className="text-[11px] font-mono px-3 py-1.5 rounded"
            style={{ backgroundColor: '#1a0d30', border: '1px solid #7c3aed', color: '#c5a8e0' }}
          >
            🎲 預覽 D6
          </button>
          <button
            onClick={() => setDiceAnimState({ dice_type: 'D20', result: 17, message: '命運對你格外寬容，效果超出預期。', coins_delta: 2, status_tag: '' })}
            className="text-[11px] font-mono px-3 py-1.5 rounded"
            style={{ backgroundColor: '#1a0d30', border: '1px solid #7c3aed', color: '#c5a8e0' }}
          >
            🎲 預覽 D20
          </button>
          <button
            onClick={() => setDiceAnimState({ dice_type: 'D20', result: 1, message: '慘敗。你的貨幣在交易中蒸發了。', coins_delta: -3, status_tag: '失血中 ✕' })}
            className="text-[11px] font-mono px-3 py-1.5 rounded"
            style={{ backgroundColor: '#1a0d30', border: '1px solid #ef4444', color: '#f9a8a8' }}
          >
            🎲 預覽 大失敗
          </button>
        </div>
      )}

      {/* --- Central Balance Scale (HUD) --- */}
      <CentralBalanceScale balance={balanceWeight} />

      {/* --- Map Container (Single Large Layer) --- */}
      <div
        ref={mapRef}
        {...bind()}
        className={`absolute top-0 left-0 cursor-grab active:cursor-grabbing touch-none will-change-transform transition-[filter] duration-1000 ${!currentUser ? 'blur-[4px] pointer-events-none grayscale' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          width: '2048px', // 优化：减少地图尺寸以提升性能 (从 4096px)
          height: '1080px', // 优化：从 2160px 减半
        }}
      >
        {/* 1. Base Map Image (Placeholder for >4000px image) */}
        {/* Using a gradient placeholder for now, user can replace with <img> */}
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: pageTheme.bgBase }}>
          {/* Grid lines for reference */}
          <div className="absolute inset-0 opacity-10"
               style={{
                 backgroundImage: `linear-gradient(to right, ${pageTheme.borderSolid} 1px, transparent 1px), linear-gradient(to bottom, ${pageTheme.borderSolid} 1px, transparent 1px)`,
                 backgroundSize: '100px 100px'
               }}
          />

          {/* Left Side (Turbid) */}
          <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-[#bdb5c8] to-[#D9D7C5] opacity-40"></div>

          {/* Right Side (Pure) */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#d4cfb8] to-[#D9D7C5] opacity-40"></div>

          {/* Central Divide */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#73706550] to-transparent"></div>
        </div>

        
        <DesignOverlay
          src="/mock/ui_overlay.png"
          enabled={overlayEnabled}
          opacity={overlayOpacity}
          scale={overlayScale}
          offsetX={overlayOffset.x}
          offsetY={overlayOffset.y}
        />

        {/* 2. Fog of War / Zone Masking */}
        {/* If user is Turbid, darken/blur Pure side, and vice versa */}
        {!isAdmin && playerFaction === 'Turbid' && (
          <div className="absolute right-0 top-0 w-1/2 h-full bg-black/60 transition-opacity duration-500 pointer-events-none flex items-center justify-center">
             <div className="text-gray-600 tracking-[1em] opacity-50 font-light">[ PURE TERRITORY ]</div>
          </div>
        )}
        {!isAdmin && playerFaction === 'Pure' && (
          <div className="absolute left-0 top-0 w-1/2 h-full bg-black/60 transition-opacity duration-500 pointer-events-none flex items-center justify-center">
             <div className="text-gray-600 tracking-[1em] opacity-50 font-light">[ TURBID TERRITORY ]</div>
          </div>
        )}

        {/* 3. Landmarks Layer */}
        {dynamicLandmarks.map(landmark => (
          <MapLandmark
            key={landmark.id}
            landmark={landmark}
            isDevMode={isDevMode}
            isVisible={isVisible(landmark.faction)}
            scale={scale}
            onClick={() => {
              if (!isDevMode && isVisible(landmark.faction) && landmark.status === 'open') {
                setSelectedLandmarkId(landmark.id);
              }
            }}
          />
        ))}

        {/* 4. NPC Icon Layer */}
        {[...MAP_NPCS, ...traffickerEntries].map(npc => (
          <div
            key={npc.id}
            className="absolute group"
            style={{ left: `${npc.x}%`, top: `${npc.y}%`, transform: 'translate(-50%, -50%)', zIndex: 25 }}
          >
            {/* ICON 本體 */}
            <button
              onClick={() => !isDevMode && setSelectedNpcId(npc.id)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full border-2 backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                backgroundColor: npc.is_open ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)',
                borderColor: npc.is_open
                  ? (playerFaction === 'Turbid' ? '#9b59b6' : '#b89f86')
                  : 'rgba(100,100,100,0.4)',
                filter: npc.is_open ? 'none' : 'grayscale(80%)',
                cursor: isDevMode ? 'default' : 'pointer',
              }}
            >
              <span className="text-lg leading-none select-none">{NPC_ROLE_ICON[npc.npc_role]}</span>

              {/* 營業狀態燈 */}
              <span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black/40"
                style={{ backgroundColor: npc.is_open ? '#22c55e' : '#6b7280' }}
              />
            </button>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              <div className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-black/85 backdrop-blur-sm border"
                style={{ borderColor: 'rgba(255,255,255,0.1)', minWidth: '120px' }}>
                <div className="font-bold text-white text-center">{npc.display_name}</div>
                <div className="text-[10px] text-center mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {NPC_ROLE_LABEL[npc.npc_role]}
                </div>
                {npc.status_text && (
                  <div className="text-[10px] text-center mt-1 border-t pt-1" style={{ color: '#a3e635', borderColor: 'rgba(255,255,255,0.1)' }}>
                    {npc.status_text}
                  </div>
                )}
                <div className="text-[9px] text-center mt-0.5" style={{ color: npc.is_open ? '#22c55e' : '#6b7280' }}>
                  {npc.is_open ? '● 營業中' : '○ 休息中'}
                </div>
              </div>
              {/* 小箭頭 */}
              <div className="w-2 h-2 bg-black/85 rotate-45 mx-auto -mt-1 border-r border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Dev Mode 座標 */}
            {isDevMode && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400 whitespace-nowrap">
                {npc.oc_name} ({npc.x},{npc.y})
              </div>
            )}
          </div>
        ))}

        

        {/* 5. Special Roles Icons (Apostate/Liquidator) positioned on Map */}
        {/* Note: In previous code they were UI elements. Now they should probably be on the map or UI? */}
        {/* User said: "Apostate System... hidden entrance... floating geometry icon" */}
        {/* If they are "UI Icons", they should stay in HUD. If they are "Map Entities", they go here. */}
        {/* Let's keep them in HUD for now as per original design, but ensure they don't block map */}
      </div>

      {/* --- 骰子判定動畫 Overlay --- */}
      {diceAnimState && (
        <DiceResultOverlay
          data={diceAnimState}
          onClose={() => setDiceAnimState(null)}
        />
      )}

      {/* --- NPC Interaction Modal --- */}
      {selectedNpcId && (() => {
        const npc = [...MAP_NPCS, ...traffickerEntries].find(n => n.id === selectedNpcId);
        if (!npc) return null;

        const wcTheme = FACTION_THEMES[playerFaction === 'Turbid' ? 'Turbid' : 'Pure'];

        const roleColor = npc.npc_role === 'black_merchant' ? '#ef4444'
          : npc.npc_role === 'trafficker'     ? '#d97706'
          : npc.npc_role === 'inn_owner'       ? '#0d9488'
          : '#9b59b6'; // pet_merchant

        // 共用 action button 樣式（roleColor accent + WC 底色）
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
            className="fixed inset-0 z-[65] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(4,2,8,0.65)' }}
            onClick={() => setSelectedNpcId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-[420px] mx-4 rounded-lg overflow-hidden"
              style={{
                background: wcTheme.cardBg,
                border: `1px solid ${wcTheme.border}`,
                boxShadow: wcTheme.shadow,
                maxHeight: 'calc(100vh - 80px)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* 頂部 roleColor 裝飾線 */}
              <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)` }} />

              {/* Header */}
              <div className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${wcTheme.tabBorder}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{NPC_ROLE_ICON[npc.npc_role]}</span>
                  <div>
                    <div className="text-[9px] tracking-[0.35em] font-mono mb-0.5 uppercase"
                      style={{ color: roleColor }}>{NPC_ROLE_LABEL[npc.npc_role]}</div>
                    <div className="text-sm font-bold tracking-wide"
                      style={{ color: wcTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>
                      {npc.display_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: npc.is_open ? 'rgba(34,197,94,0.12)' : wcTheme.itemBg,
                      color: npc.is_open ? '#22c55e' : wcTheme.textMuted,
                      border: `1px solid ${npc.is_open ? 'rgba(34,197,94,0.25)' : wcTheme.tabBorder}`,
                    }}>
                    {npc.is_open ? '● 營業' : '○ 休息'}
                  </span>
                  <motion.button
                    whileHover={{ opacity: 0.7 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setSelectedNpcId(null)}
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

              {/* Body */}
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

                    {/* ── 黑心商人 / 道具商人 ── */}
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

                    {/* ── 旅店老闆 ── */}
                    {npc.npc_role === 'inn_owner' && (
                      <div className="space-y-2.5">
                        {!currentUser ? (
                          <div className="text-center py-6 text-xs italic" style={{ color: wcTheme.textMuted }}>請先登入才能使用旅店服務</div>
                        ) : (
                          <>
                            {/* 治療 */}
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

                            {/* 救援 */}
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

                    {/* ── 寵物商人 ── */}
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

                    {/* ── 人販子 ── */}
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

              {/* Footer */}
              <div className="px-5 py-2 flex justify-end text-[9px] tracking-widest font-mono"
                style={{ borderTop: `1px solid ${wcTheme.tabBorder}`, color: wcTheme.textMuted, opacity: 0.5 }}>
                NPC · {npc.oc_name}
              </div>
            </motion.div>
          </motion.div>
        );
      })()}

      {/* --- Landmark Story Modal --- */}
      <AnimatePresence>
      {selectedLandmarkId && (() => {
        const landmark = dynamicLandmarks.find(l => l.id === selectedLandmarkId);
        const chapterEntry = (landmarkChaptersData.chapters as any[])
          .flatMap(ch => ch.landmarks)
          .find((l: any) => l.id === selectedLandmarkId);

        if (!landmark) return null;

        const hasStory = chapterEntry && (
          chapterEntry.intro_text || chapterEntry.mission_text ||
          chapterEntry.teamup_text || chapterEntry.outro_text
        );

        return (
          <motion.div
            key="landmark-modal"
            className="fixed inset-0 z-[65] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0)' }}
            initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
            animate={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
            transition={{ duration: 0.22 }}
            onClick={() => { setSelectedLandmarkId(null); setPartyJoinResult(null); }}
          >
            <motion.div
              className="relative w-full max-w-[480px] mx-4 rounded-lg border overflow-hidden"
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
              onClick={e => e.stopPropagation()}
            >
              {/* 頂部裝飾線 */}
              <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${pageTheme.primary}, transparent)`, flexShrink: 0 }} />

              {/* Header */}
              <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${pageTheme.border}` }}>
                {/* Row 1：陣營標籤 + 關閉 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[9px] tracking-[0.4em] uppercase font-mono mb-1.5"
                      style={{ color: pageTheme.textSecondary, opacity: 0.7 }}>
                      {landmark.faction === 'Turbid' ? '濁息據點' : '淨塵據點'}
                    </div>
                    <div className="text-[22px] font-bold leading-tight"
                      style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif", letterSpacing: '0.12em' }}>
                      {landmark.name}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedLandmarkId(null); setPartyJoinResult(null); }}
                    className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full hover:opacity-60 transition-opacity"
                    style={{ border: `1px solid ${pageTheme.border}`, color: pageTheme.textSecondary }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Row 2：人數 + 加入按鈕（常駐可見） */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  {/* 人數徽章 */}
                  {landmark.capacity != null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono" style={{ color: pageTheme.textSecondary, opacity: 0.6 }}>組隊人數</span>
                      <span className="text-[13px] font-mono font-bold px-2.5 py-0.5 rounded-md"
                        style={{
                          color: (landmark.occupants ?? 0) >= landmark.capacity ? '#f87171' : '#4ade80',
                          backgroundColor: (landmark.occupants ?? 0) >= landmark.capacity ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                          border: `1px solid ${(landmark.occupants ?? 0) >= landmark.capacity ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.25)'}`,
                        }}>
                        {landmark.occupants ?? 0}/{landmark.capacity}
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* 加入按鈕區 */}
                  {currentUser && landmark.status === 'open' && currentUser.faction === landmark.faction ? (
                    partyJoinResult === 'success' ? (
                      <div className="text-[11px] font-mono px-3 py-1.5 rounded-md"
                        style={{ color: playerFaction === 'Turbid' ? '#a78bfa' : '#b89f86', backgroundColor: playerFaction === 'Turbid' ? 'rgba(167,139,250,0.1)' : 'rgba(184,159,134,0.12)', border: `1px solid ${playerFaction === 'Turbid' ? 'rgba(167,139,250,0.25)' : 'rgba(184,159,134,0.25)'}` }}>
                        ✦ 已申請加入
                      </div>
                    ) : partyJoinResult === 'full' ? (
                      <div className="text-[11px] font-mono px-3 py-1.5 rounded-md"
                        style={{ color: '#f87171', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                        ✕ 人數已滿
                      </div>
                    ) : partyJoinResult === 'already' ? (
                      <div className="text-[11px] font-mono px-3 py-1.5 rounded-md"
                        style={{ color: pageTheme.textSecondary, backgroundColor: 'transparent', border: `1px solid ${pageTheme.border}` }}>
                        已在組隊中
                      </div>
                    ) : (
                      <button
                        disabled={partyJoinLoading}
                        onClick={async () => {
                          if (!currentUser || partyJoinLoading) return;
                          setPartyJoinLoading(true);
                          setPartyJoinResult(null);
                          try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/party/join`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                oc_name: currentUser.oc_name,
                                landmark_id: landmark.id,
                                required_count: landmark.capacity ?? 2,
                              }),
                            });
                            const data = await res.json();
                            if (data.error === 'PARTY_FULL') setPartyJoinResult('full');
                            else if (data.error === 'ALREADY_IN_PARTY') setPartyJoinResult('already');
                            else if (res.ok) setPartyJoinResult('success');
                            else setPartyJoinResult('error');
                          } catch {
                            setPartyJoinResult('error');
                          } finally {
                            setPartyJoinLoading(false);
                          }
                        }}
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

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7"
                style={{ fontFamily: "'Noto Serif TC', serif" }}>

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
                          <span className="text-[16px] font-bold tracking-[0.06em]"
                            style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>據點描述</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3"
                          style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                          {chapterEntry.intro_text}
                        </p>
                      </div>
                    )}

                    {chapterEntry.mission_text && (
                      <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-0.5 h-[18px] rounded-full flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                          <span className="text-[16px] font-bold tracking-[0.06em]"
                            style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>任務內容</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3"
                          style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                          {chapterEntry.mission_text}
                        </p>
                      </div>
                    )}

                    {(chapterEntry.teamup_text || chapterEntry.npc_text) && (
                      <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-0.5 h-[18px] rounded-full flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                          <span className="text-[16px] font-bold tracking-[0.06em]"
                            style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>組隊內容</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        {chapterEntry.teamup_text && (
                          <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3"
                            style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                            {chapterEntry.teamup_text}
                          </p>
                        )}
                        {chapterEntry.npc_text && (
                          <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3 mt-3"
                            style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                            {chapterEntry.npc_text}
                          </p>
                        )}
                      </div>
                    )}

                    {chapterEntry.outro_text && (
                      <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-0.5 h-[18px] rounded-full flex-shrink-0" style={{ backgroundColor: pageTheme.primary }} />
                          <span className="text-[16px] font-bold tracking-[0.06em]"
                            style={{ color: pageTheme.textPrimary, fontFamily: "'Noto Serif TC', serif" }}>結局</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${pageTheme.primary}40, transparent)` }} />
                        </div>
                        <p className="text-[14px] leading-[2.1] whitespace-pre-wrap pl-3"
                          style={{ color: pageTheme.textPrimary, letterSpacing: '0.04em', opacity: 0.85 }}>
                          {chapterEntry.outro_text}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-2 border-t flex justify-between text-[9px] tracking-widest font-mono flex-shrink-0"
                style={{ borderColor: pageTheme.border, color: pageTheme.textSecondary, opacity: 0.4 }}>
                <span>{chapterEntry?.chapter_unlock ? `Ch ${chapterEntry.chapter_unlock}` : 'Ch 1.0'}</span>
                <span>{landmark.status === 'open' ? 'OPEN' : 'CLOSED'}</span>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
      </AnimatePresence>

      {/* --- HUD Layer (Fixed UI) --- */}
      
      {/* 1. Left Sidebar Navigation */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-3 p-3 pointer-events-none">
         {[
           { icon: Bell, label: '公告', id: 'announcement' },
           { icon: ScrollText, label: '任務', id: 'quest' },
           { icon: CalendarDays, label: '日誌', id: 'daily' },
           { icon: BookOpen, label: '圖鑑', id: 'collection' },
           { icon: Backpack, label: '背包', id: 'inventory' },
         ].map((item) => {
           const pos = navPositions[item.id] || { x: 0, y: 0 };
           const isDisabledByKidnap = currentUser?.is_lost === true;
           return (
             <DraggableUIButton
               key={item.id}
               id={item.id}
               pos={pos}
               isDevMode={isDevMode}
               onClick={() => { if (!isDevMode && !isDisabledByKidnap) { Sounds.panelOpen(); setActiveTab(item.id); } }}
               whileHover={isDisabledByKidnap ? {} : { x: (navPositions[item.id]?.x || 0) + 5, scale: 1.1 }}
               whileTap={isDisabledByKidnap ? {} : { scale: 0.95 }}
               className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-sm backdrop-blur-sm pointer-events-auto ptd-ui-nav-button
                          ${isDisabledByKidnap ? 'opacity-40 cursor-not-allowed' : activeTab === item.id ? 'active' : ''}
                          ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
             >
               <item.icon className="w-4 h-4" />
               {/* Tooltip */}
               {!isDevMode && (
                 <span className="absolute left-full ml-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border pointer-events-none font-mono"
                   style={{ backgroundColor: pageTheme.bgBase, color: pageTheme.textPrimary, borderColor: pageTheme.border }}>
                   {item.label}
                 </span>
               )}
             </DraggableUIButton>
           );
         })}

        {/* NPC Panel Button — only visible when user is an NPC */}
        {currentUser?.npc_role && (
          <DraggableUIButton
            id="npc"
            pos={navPositions['npc'] || { x: 0, y: 0 }}
            isDevMode={isDevMode}
            onClick={() => !isDevMode && setActiveTab('npc')}
            whileHover={{ x: (navPositions['npc']?.x || 0) + 5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-sm backdrop-blur-sm pointer-events-auto ptd-ui-nav-button
              ${activeTab === 'npc' ? 'active' : ''}
              ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
          >
            <Wrench className="w-4 h-4" />
            {!isDevMode && (
              <span className="absolute left-full ml-3 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-xs font-mono border"
                style={{ backgroundColor: pageTheme.bgBase, color: pageTheme.textPrimary, borderColor: pageTheme.border }}>
                NPC面板
              </span>
            )}
          </DraggableUIButton>
        )}

        {/* Leader Tyranny Button — only visible when identity_role = 'leader' */}
        {currentUser?.identity_role === 'leader' && (
          <DraggableUIButton
            id="tyranny"
            pos={navPositions['tyranny'] || { x: 0, y: 0 }}
            isDevMode={isDevMode}
            onClick={() => !isDevMode && setActiveTab('tyranny')}
            whileHover={{ x: (navPositions['tyranny']?.x || 0) + 5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-lg backdrop-blur-sm pointer-events-auto
              ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
          >
            <Crown className="w-4 h-4" />
            {!isDevMode && (
              <span className="absolute left-full ml-3 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-xs font-mono"
                style={{ backgroundColor: '#1a0505', color: '#fca5a5', border: `1px solid ${FACTION_COLORS.leaderEvil}` }}>
                {currentUser?.faction === 'Pure' ? '教廷面板' : '惡政面板'}
              </span>
            )}
          </DraggableUIButton>
        )}

        {/* 陣營結算按鈕 — 所有登入玩家可見 */}
        {currentUser && (
          <DraggableUIButton
            id="settlement"
            pos={navPositions['settlement'] || { x: 0, y: 0 }}
            isDevMode={isDevMode}
            onClick={() => !isDevMode && setShowSettlement(true)}
            whileHover={{ x: (navPositions['settlement']?.x || 0) + 5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-sm backdrop-blur-sm pointer-events-auto ptd-ui-nav-button
              ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
            style={{ borderColor: pageTheme.border, position: 'relative', overflow: 'visible' }}
          >
            {/* 呼吸燈：陣營色彩 */}
            <span
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                '--breathe-color': currentUser.faction === 'Turbid' ? '#7c3aed' : '#d4af37',
                animation: 'settlement-breathe 2.4s ease-in-out infinite',
              } as React.CSSProperties}
            />
            <Scale className="w-4 h-4 relative z-10" style={{
              color: currentUser.faction === 'Turbid' ? '#7c3aed' : '#c09a30',
            }} />
            {!isDevMode && (
              <span className="absolute left-full ml-3 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-xs font-mono border"
                style={{ backgroundColor: pageTheme.bgBase, color: pageTheme.textPrimary, borderColor: pageTheme.border }}>
                陣營結算
              </span>
            )}
          </DraggableUIButton>
        )}
      </div>
      <div className="fixed top-3 right-3 sm:top-6 sm:right-8 z-[100] flex items-center gap-3 sm:gap-6">
        {/* Currency Display */}
        {currentUser && (
          <div
            className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border backdrop-blur-md cursor-pointer"
            style={{ backgroundColor: pageTheme.panelBg, borderColor: pageTheme.border }}
            onClick={() => Sounds.coin()}
          >
            <div className="flex items-center gap-1 sm:gap-2" title={getCurrencyName()}>
              {React.createElement(getCurrencyIcon(), { className: 'w-2 h-2', style: { color: pageTheme.secondary } })}
              <span className="text-sm font-mono" style={{ color: pageTheme.textPrimary }}>
                {currentUser.coins || 0}
              </span>
            </div>
          </div>
        )}

        {/* Login/User Button */}
        <button
          onClick={() => currentUser ? setCharacterCardTarget(currentUser.oc_name) : setShowLogin(true)}
          className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all group"
          style={{ backgroundColor: pageTheme.panelBg, borderColor: pageTheme.border }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = pageTheme.borderSolid; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = pageTheme.border; }}
        >
          <div className={`w-2 h-2 rounded-full ${currentUser ? 'bg-green-600 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="hidden sm:inline text-sm tracking-wider uppercase" style={{ color: pageTheme.textPrimary }}>
            {currentUser ? currentUser.oc_name : 'TERMINAL DISCONNECTED'}
          </span>
          <span className="sm:hidden text-xs tracking-wider uppercase" style={{ color: pageTheme.textPrimary }}>
            {currentUser ? currentUser.oc_name : 'LOGIN'}
          </span>
          <User className="w-3 h-3" style={{ color: pageTheme.textSecondary }} />
        </button>

        {/* Notification Bell */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => { Sounds.bell(); setNotificationOpen(prev => !prev); }}
              className="relative p-2 rounded-full border transition-all"
              style={{ backgroundColor: pageTheme.panelBg, borderColor: pageTheme.border, color: pageTheme.textSecondary }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = pageTheme.borderSolid; e.currentTarget.style.color = pageTheme.textPrimary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = pageTheme.border; e.currentTarget.style.color = pageTheme.textSecondary; }}
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationOpen && (
              <div
                className="absolute right-0 top-10 w-80 max-w-[calc(100vw-32px)] max-h-96 overflow-y-auto rounded border z-[80] flex flex-col custom-scrollbar"
                style={{ backgroundColor: pageTheme.bgBase, borderColor: pageTheme.border }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: pageTheme.divider }}>
                  <span className="text-[11px] tracking-[0.2em] uppercase font-mono" style={{ color: pageTheme.textSecondary }}>通知記錄</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-[10px] tracking-widest transition-colors"
                      style={{ color: pageTheme.textSecondary }}
                      onMouseEnter={e => (e.currentTarget.style.color = pageTheme.textPrimary)}
                      onMouseLeave={e => (e.currentTarget.style.color = pageTheme.textSecondary)}
                    >
                      全部已讀
                    </button>
                  )}
                </div>
                {notifications.filter(n => n.notification_type === 'private').length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs italic font-mono" style={{ color: pageTheme.textMuted }}>
                    暫無通知
                  </div>
                ) : (
                  <div style={{ borderColor: pageTheme.divider }}>
                    {notifications
                      .filter(n => n.notification_type === 'private')
                      .slice(0, 20)
                      .map(n => (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && markRead(n.id)}
                          className={`px-4 py-3 cursor-pointer transition-colors border-b ${n.is_read ? 'opacity-40' : ''}`}
                          style={{ borderColor: pageTheme.divider }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = pageTheme.border)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <p className="text-xs font-mono leading-relaxed" style={{ color: pageTheme.textPrimary }}>{n.content}</p>
                          <p className="text-[10px] mt-1 font-mono" style={{ color: pageTheme.textSecondary }}>
                            {new Date(n.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            {!n.is_read && <span className="ml-2" style={{ color: pageTheme.factionGold }}>●</span>}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Top Right Settings Icon */}
        <button
          onClick={() => setActiveTab('settings')}
          className="p-2 rounded-full border transition-all"
          style={{ backgroundColor: pageTheme.panelBg, borderColor: pageTheme.border, color: pageTheme.textSecondary }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = pageTheme.borderSolid; e.currentTarget.style.color = pageTheme.textPrimary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = pageTheme.border; e.currentTarget.style.color = pageTheme.textSecondary; }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Developer Mode Toggle */}
        {currentUser && (currentUser.oc_name || '').toLowerCase() === 'vonn' && (
          <button
            onClick={() => setIsDevMode(!isDevMode)}
            className={`p-2 border rounded-full transition-all flex items-center gap-2 px-3
              ${isDevMode ? 'bg-cyan-900/40 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}`}
            style={isDevMode ? {} : { backgroundColor: pageTheme.panelBg, borderColor: pageTheme.border, color: pageTheme.textSecondary }}
          >
            <Activity className={`w-3.5 h-3.5 ${isDevMode ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-mono tracking-widest uppercase">{isDevMode ? 'DEV ON' : 'DEV OFF'}</span>
          </button>
        )}
      </div>

      {/* Developer Coordinate Display */}
      <AnimatePresence>
        {isDevMode && lastReleasedPos && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-black/90 border border-cyan-500/50 p-4 backdrop-blur-md rounded shadow-2xl pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-cyan-500 font-mono tracking-[0.3em] uppercase">Coordinate Detected</span>
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-200 font-serif italic">『{lastReleasedPos.name}』</span>
                <span className="text-lg font-mono text-white bg-cyan-950/50 px-3 py-1 border border-cyan-900/50">
                  X: {typeof lastReleasedPos.x === 'number' ? lastReleasedPos.x.toFixed(1) : lastReleasedPos.x} , 
                  Y: {typeof lastReleasedPos.y === 'number' ? lastReleasedPos.y.toFixed(1) : lastReleasedPos.y}
                </span>
              </div>
              <p className="text-[9px] text-gray-500 mt-1 font-sans">請將此座標回報給管理員進行固定</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Toolbar Container */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-8 pointer-events-none">
        
        {/* Upper Tools Group */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          
          {/* Breathing Icon (Gift System) */}
          

          {isAdmin && (
            <DraggableUIButton
              key="overlay"
              id="overlay"
              pos={overlayBtnPos}
              isDevMode={isDevMode}
              onClick={() => {
                if (!isDevMode) {
                  setOverlayEnabled(!overlayEnabled);
                }
              }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-lg backdrop-blur-sm mx-auto
                ${overlayEnabled ? 'bg-white text-black border-white' : 'bg-gray-900/80 text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800'}
                ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
              title="設計疊圖"
            >
              <Settings className="w-3.5 h-3.5" />
            </DraggableUIButton>
          )}

          {/* Apostate Icon (Only if role is apostate) */}
           {currentUser && currentUser.identity_role === 'apostate' && (
              <ApostateGeometryIcon 
                key={`apostate-${geometryPos.x}-${geometryPos.y}`}
                onClick={() => !isDevMode && setApostateMenuOpen(true)} 
                isAvailable={true} 
                isDevMode={isDevMode}
                dragProps={{
                  // Position controlled by DevPanel or defaults
                  // We removed direct drag logic here to prefer DevPanel, but we need to render it correctly.
                  // ApostateGeometryIcon might expect dragProps.
                  // For now, passing dummy drag props if we want to rely on DevPanel
                  // Or we can keep it draggable if it's not part of the unified map layer.
                  // Since it's UI, let's keep it simple.
                  style: { position: 'relative' }
                }}
              />
           )}

           {/* Liquidator Icon */}
           {currentUser && currentUser.identity_role === 'liquidator' && (
              <LiquidatorLensIcon 
                key={`liquidator-${liquidatorPos.x}-${liquidatorPos.y}`}
                onClick={() => !isDevMode && setLiquidatorMenuOpen(true)} 
                isAvailable={true} 
                isDevMode={isDevMode}
                dragProps={{
                  style: { position: 'relative' }
                }}
              />
           )}
        </div>

        {/* Zoom Controls Group */}
        <DraggableUIButton
          key="zoom"
          id="zoom"
          pos={zoomControlsPos}
          isDevMode={isDevMode}
          className={`flex flex-col bg-gray-900/80 border border-gray-600 rounded-lg overflow-hidden backdrop-blur-sm pointer-events-auto shadow-lg
            ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
        >
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border-b border-gray-700/50"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </DraggableUIButton>
        {overlayEnabled && (
          <div className="mt-3 bg-gray-900/80 border border-gray-700 rounded-lg p-2 text-[10px] text-gray-300 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span>Opacity</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span>Scale</span>
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.05}
                value={overlayScale}
                onChange={(e) => setOverlayScale(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span>OffsetX</span>
              <input
                type="range"
                min={-3000}
                max={3000}
                step={1}
                value={overlayOffset.x}
                onChange={(e) => setOverlayOffset(prev => ({ ...prev, x: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span>OffsetY</span>
              <input
                type="range"
                min={-3000}
                max={3000}
                step={1}
                value={overlayOffset.y}
                onChange={(e) => setOverlayOffset(prev => ({ ...prev, y: Number(e.target.value) }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 9. Exhale Modal */}
      

      {/* 5. Modals System */}
      {/* 背景遮罩 */}
      <AnimatePresence>
        {activeTab && activeTab !== 'none' && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setActiveTab(null)}
          />
        )}
      </AnimatePresence>

      {/* 新版面板：announcement / quest / daily / collection / settings */}
      <div className="fixed inset-0 z-50 flex items-center justify-start pl-20 pointer-events-none">
        <div className="pointer-events-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'announcement' && (
              <AnnouncementPanel
                announcements={announcements}
                onClose={() => setActiveTab(null)}
                faction={currentUser?.faction as 'Turbid' | 'Pure'}
              />
            )}
            {activeTab === 'quest' && (
              <QuestPanel
                missions={missions.filter(m => m.faction === 'Common' || m.faction === playerFaction)}
                onClose={() => setActiveTab(null)}
                onJoinMission={handleMissionJoin}
                onSubmitReport={handleReportSubmit}
                isLocked={isLocked}
                hasReportedMain={hasReportedMain}
                faction={currentUser?.faction as 'Turbid' | 'Pure'}
              />
            )}
            {activeTab === 'daily' && (
              <DailyPanel
                echoes={gazetteEntries.map(entry => ({
                  id: entry.id,
                  content: entry.gazette_content || `${entry.oc_name} 在 ${entry.landmark_id} 完成了任務`,
                  timestamp: new Date(entry.created_at).toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }))}
                snippets={dailySnippets}
                onClose={() => setActiveTab(null)}
                onLikeSnippet={handleLikeSnippet}
                faction={currentUser?.faction as 'Turbid' | 'Pure'}
              />
            )}
            {activeTab === 'collection' && (
              <CollectionPanel
                onClose={() => setActiveTab(null)}
                faction={currentUser?.faction as 'Turbid' | 'Pure'}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsPanel
                bgmVolume={bgmVolume}
                sfxVolume={sfxVolume}
                onBgmVolumeChange={setBgmVolume}
                onSfxVolumeChange={setSfxVolume}
                onClose={() => setActiveTab(null)}
                faction={currentUser?.faction as 'Turbid' | 'Pure'}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 舊版面板：inventory / npc / tyranny */}
      <AnimatePresence>
        {activeTab && ['inventory', 'npc', 'tyranny'].includes(activeTab) && (
          <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-start pl-20" style={{ pointerEvents: 'auto' }}>
            <WhiteCrowCard
              title={
                activeTab === 'inventory' ? '混沌背包' :
                activeTab === 'npc' ? 'NPC 面板' :
                activeTab === 'tyranny' ? (currentUser?.faction === 'Pure' ? '教廷面板' : '惡政面板') : ''
              }
              code={
                activeTab === 'inventory' ? 'INVENTORY · SYS' :
                activeTab === 'npc' ? 'NPC · TERMINAL' :
                'TYRANNY · PANEL'
              }
              onClose={() => setActiveTab(null)}
              faction={currentUser?.faction as 'Turbid' | 'Pure'}
            >

              {/* --- 背包 (Inventory) --- */}
              {activeTab === 'inventory' && (
                <div className="h-full flex flex-col">
                  {/* Currency Header */}
                  <div className="flex gap-4 mb-6 p-4 border ptd-ui-rounded" style={{ backgroundColor: pageTheme.tagBg, borderColor: pageTheme.border }}>
                    <div className="flex-1 flex items-center gap-2">
                       <Coins className="w-3 h-3" style={{ color: pageTheme.textPrimary }} />
                       <div>
                        <div className="text-[10px] uppercase" style={{ color: pageTheme.textSecondary }}>貨幣</div>
                         <div className="text-lg font-mono" style={{ color: pageTheme.textPrimary }}>{currentUser?.coins || 0}</div>
                       </div>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <div className="text-xs uppercase" style={{ color: pageTheme.textSecondary }}>
                        Capacity: <span style={{ color: currentUser?.inventory && currentUser.inventory.length >= MAX_INVENTORY_SIZE ? pageTheme.error : pageTheme.textPrimary }}>
                          {currentUser?.inventory?.length || 0}/{MAX_INVENTORY_SIZE}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid or Empty State */}
                  {currentUser?.inventory && currentUser.inventory.length > 0 ? (
                    <div className="grid grid-cols-6 gap-2">
                       {currentUser.inventory.map((item, i) => (
                         <div key={i} className="aspect-square border ptd-ui-rounded flex items-center justify-center relative group"
                           style={{ backgroundColor: pageTheme.tagBg, borderColor: pageTheme.border }}>
                           <div className="w-8 h-8 rounded-full opacity-50" style={{ backgroundColor: pageTheme.primary }}></div>
                           <span className="absolute bottom-1 right-1 text-[8px]" style={{ color: pageTheme.textSecondary }}>x1</span>
                         </div>
                       ))}
                       {Array.from({ length: Math.max(0, MAX_INVENTORY_SIZE - (currentUser.inventory.length)) }).map((_, i) => (
                         <div key={`empty-${i}`} className="aspect-square border ptd-ui-rounded" style={{ backgroundColor: pageTheme.inputBg, borderColor: pageTheme.border }}></div>
                       ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                       <div className="w-16 h-16 border rounded-full flex items-center justify-center mb-4" style={{ borderColor: pageTheme.border }}>
                         <span className="text-2xl">💨</span>
                       </div>
                       <p className="text-sm font-serif italic" style={{ color: pageTheme.textSecondary }}>
                         「行囊空空如也，<br/>唯有風聲在其中迴盪。」
                       </p>
                    </div>
                  )}

                </div>
              )}

              {/* --- NPC Panel --- */}
              {activeTab === 'npc' && currentUser && currentUser.npc_role && (
                <div className="py-2">
                  <NPCPanel
                    currentUser={currentUser}
                    onUpdate={(updates) => setCurrentUser(prev => prev ? { ...prev, ...updates } : prev)}
                  />
                </div>
              )}

              {/* --- 領主惡政面板 --- */}
              {activeTab === 'tyranny' && currentUser?.identity_role === 'leader' && (
                <LeaderTyrannyPanel
                  leaderOcName={currentUser.oc_name}
                  chapter={CURRENT_CHAPTER}
                  faction={currentUser.faction}
                />
              )}

            </WhiteCrowCard>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Drift Bottle Creator Modal */}
      <AnimatePresence>
        {driftModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
            onClick={() => setDriftModalOpen(false)}
          >
            <div className="w-full max-w-[500px] mx-4 p-6 sm:p-8 shadow-2xl relative ptd-ui-rounded" style={{ backgroundColor: pageTheme.bgBase, border: `1px solid ${pageTheme.border}` }} onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-serif text-center tracking-widest mb-6" style={{ color: pageTheme.textPrimary }}>刻寫殘卷</h3>

              <div className="min-h-[100px] p-4 mb-6 flex flex-wrap gap-2 items-start content-start ptd-ui-rounded" style={{ border: `1px solid ${pageTheme.border}`, backgroundColor: pageTheme.tagBg }}>
                {driftMessage.length > 0 ? (
                  driftMessage.map((word, idx) => (
                    <span key={idx} className="px-2 py-1 text-sm font-mono ptd-ui-rounded-sm" style={{ backgroundColor: pageTheme.textPrimary, color: pageTheme.bgBase }}>{word}</span>
                  ))
                ) : (
                  <span className="text-sm italic" style={{ color: pageTheme.textSecondary }}>請從下方選擇詞彙拼湊訊息...</span>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-8">
                {wordBank.map(word => (
                  <button
                    key={word}
                    onClick={() => handleWordSelect(word)}
                    disabled={driftMessage.length >= 5}
                    className="py-2 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ptd-ui-rounded"
                    style={{ border: `1px solid ${pageTheme.border}`, color: pageTheme.textPrimary, backgroundColor: 'transparent' }}
                  >
                    {word}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6" style={{ borderTop: `1px solid ${pageTheme.divider}` }}>
                <button
                  onClick={() => setDriftMessage([])}
                  className="text-xs transition-colors"
                  style={{ color: pageTheme.textSecondary }}
                >
                  清除重寫
                </button>
                <div className="flex gap-4">
                  <span className="text-xs flex items-center gap-1" style={{ color: pageTheme.textSecondary }}>
                    消耗: <span style={{ color: currentUser && currentUser.coins >= 5 ? pageTheme.textPrimary : pageTheme.error }}>5</span> <Coins className="w-2 h-2" style={{ color: pageTheme.textPrimary }} />
                  </span>
                  <div className="px-6 py-2 text-xs font-mono" style={{ color: pageTheme.textSecondary }}>此功能已停用</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      

      <LoginModal
        visible={showLogin}
        username={inputUsername}
        password={inputPassword}
        onUsernameChange={setInputUsername}
        onPasswordChange={setInputPassword}
        onSubmit={handleLogin}
      />

      {/* 首次登入：設定密碼 modal */}
      <AnimatePresence>
        {showSetPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          >
            <div className="w-full max-w-[400px] mx-4 p-6 sm:p-8 relative overflow-hidden shadow-2xl ptd-ui-rounded" style={{ backgroundColor: pageTheme.bgBase, border: `1px solid ${pageTheme.border}` }}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(to right, transparent, ${pageTheme.borderSolid}, transparent)` }} />
              <h3 className="text-xl font-light text-center tracking-[0.3em] mb-3 font-serif" style={{ color: pageTheme.textPrimary }}>
                SET PASSCODE
              </h3>
              <p className="text-xs text-center mb-8 font-mono leading-relaxed px-4" style={{ color: pageTheme.textSecondary }}>
                首次連結偵測。<br />
                請設定你的專屬四位數字密鑰，<br />
                此後將以此作為唯一憑證。
              </p>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest" style={{ color: pageTheme.textSecondary }}>New Passcode</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full p-3 focus:outline-none transition-colors text-sm font-mono tracking-[0.5em] ptd-ui-rounded"
                    style={{ backgroundColor: pageTheme.inputBg, border: `1px solid ${pageTheme.inputBorder}`, color: pageTheme.textPrimary }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest" style={{ color: pageTheme.textSecondary }}>Confirm Passcode</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full p-3 focus:outline-none transition-colors text-sm font-mono tracking-[0.5em] ptd-ui-rounded"
                    style={{ backgroundColor: pageTheme.inputBg, border: `1px solid ${pageTheme.inputBorder}`, color: pageTheme.textPrimary }}
                  />
                </div>
                {setPasswordError && (
                  <p className="text-xs font-mono text-red-600">{setPasswordError}</p>
                )}
                <button
                  onClick={handleSetPassword}
                  className="w-full py-3 mt-2 text-sm font-bold tracking-widest uppercase transition-colors ptd-ui-rounded"
                  style={{ backgroundColor: pageTheme.textPrimary, color: pageTheme.bgBase }}
                >
                  Confirm & Connect
                </button>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: `linear-gradient(to right, transparent, ${pageTheme.borderSolid}, transparent)` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentUser && (
        <>
          <ApostateSystem 
            currentUser={currentUser}
            currentChapter={CURRENT_CHAPTER}
            onUpdateUser={(updates) => setCurrentUser(prev => prev ? ({ ...prev, ...updates }) : null)}
            menuOpen={apostateMenuOpen}
            setMenuOpen={setApostateMenuOpen}
          />

          <LiquidatorSystem 
            currentUser={currentUser}
            currentChapter={CURRENT_CHAPTER}
            onUpdateUser={(updates) => setCurrentUser(prev => prev ? ({ ...prev, ...updates }) : null)}
            menuOpen={liquidatorMenuOpen}
            setMenuOpen={setLiquidatorMenuOpen}
          />
        </>
      )}

      {/* Admin Apostate Control Panel */}
      {currentUser && (currentUser.oc_name || '').toLowerCase() === 'vonn' && (
        <AdminApostateControl
          currentUser={currentUser}
          onUpdate={() => {
            // Optional: Refresh logic if needed
          }}
        />
      )}

      {/* Kidnap Popup — 被綁架時全螢幕遮罩 */}
      {popupNotification && currentUser?.is_lost && (
        <KidnapPopup
          notification={popupNotification}
          lostUntil={currentUser.lost_until ?? null}
          onMarkRead={() => markRead(popupNotification.id)}
          onOpenCharacterCard={() => setCharacterCardTarget(currentUser.oc_name)}
        />
      )}

      {/* Character Card Modal */}
      {characterCardTarget && currentUser && (
        <CharacterCard
          targetOcName={characterCardTarget}
          viewerFaction={currentUser.faction}
          currentUserOcName={currentUser.oc_name}
          onClose={() => setCharacterCardTarget(null)}
        />
      )}

      {/* Balance Settlement Modal */}
      {showSettlement && (
        <BalanceSettlementModal
          chapterVersion="ch01_v3"
          onClose={() => setShowSettlement(false)}
        />
      )}

    </div>
  );
};
