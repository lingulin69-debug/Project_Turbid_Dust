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

// Extended Landmark Interface
interface Landmark extends LandmarkData {
  // Inherits from LandmarkData
}

// Updated Data with Types
const landmarks: Landmark[] = [
  { id: 'l1', name: '空衣街區', x: 20, y: 40, faction: 'Turbid', status: 'open', occupants: 2, capacity: 5, type: 'town' },
  { id: 'l2', name: '舊觀測站', x: 45, y: 30, faction: 'Turbid', status: 'closed', occupants: 0, capacity: 3, type: 'school' },
  { id: 'l3', name: '淨化尖塔', x: 75, y: 50, faction: 'Pure', status: 'open', occupants: 5, capacity: 10, type: 'church' },
  { id: 'l4', name: '中央圖書館', x: 60, y: 65, faction: 'Pure', status: 'open', occupants: 1, capacity: 8, type: 'school' },
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

export const MapTestView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [playerFaction, setPlayerFaction] = useState<'Turbid' | 'Pure' | 'Common'>('Common');
  const [isAdmin, setIsAdmin] = useState(false);
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

  // 1999 Style Word Bank
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

  const handleReportSubmit = async () => {
    if (!currentUser) return;
    const subject = reportSubject.trim();

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
    } catch (err: any) {
      setMarketError(err.message || '購買失敗');
    } finally {
      setBuyingSlotId(null);
    }
  };

  const handleBuyPet = async (pet: ShopPet) => {
    if (!currentUser) return;
    setBuyingPetId(pet.id);
    setPetsError('');
    try {
      const result = await apiClient.pets.buy(currentUser.oc_name, pet.id, CURRENT_CHAPTER);
      setCurrentUser(prev => prev ? ({ ...prev, coins: result.coins_remaining ?? result.new_coins }) : prev);
      fetchPets();
      alert(result.message || '購買成功');
    } catch (err: any) {
      setPetsError(err.message || '購買失敗');
    } finally {
      setBuyingPetId(null);
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

  return (
    <div
      className="w-full h-screen overflow-hidden relative font-sans"
      style={{ backgroundColor: '#D9D7C5', color: '#403E34' }}
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
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#D9D7C5' }}>
          {/* Grid lines for reference */}
          <div className="absolute inset-0 opacity-10"
               style={{
                 backgroundImage: 'linear-gradient(to right, #737065 1px, transparent 1px), linear-gradient(to bottom, #737065 1px, transparent 1px)',
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
          <div className="absolute right-0 top-0 w-1/2 h-full bg-black/60 backdrop-blur-sm transition-all duration-1000 pointer-events-none flex items-center justify-center">
             <div className="text-gray-600 tracking-[1em] opacity-50 font-light">[ PURE TERRITORY ]</div>
          </div>
        )}
        {!isAdmin && playerFaction === 'Pure' && (
          <div className="absolute left-0 top-0 w-1/2 h-full bg-black/60 backdrop-blur-sm transition-all duration-1000 pointer-events-none flex items-center justify-center">
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
          />
        ))}

        

        {/* 5. Special Roles Icons (Apostate/Liquidator) positioned on Map */}
        {/* Note: In previous code they were UI elements. Now they should probably be on the map or UI? */}
        {/* User said: "Apostate System... hidden entrance... floating geometry icon" */}
        {/* If they are "UI Icons", they should stay in HUD. If they are "Map Entities", they go here. */}
        {/* Let's keep them in HUD for now as per original design, but ensure they don't block map */}
      </div>


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
               onClick={() => !isDevMode && !isDisabledByKidnap && setActiveTab(item.id)}
               whileHover={isDisabledByKidnap ? {} : { x: (navPositions[item.id]?.x || 0) + 5, scale: 1.1 }}
               whileTap={isDisabledByKidnap ? {} : { scale: 0.95 }}
               className={`relative group flex items-center justify-center w-9 h-9 border rounded-xl transition-colors shadow-sm backdrop-blur-sm pointer-events-auto
                          ${isDisabledByKidnap ? 'opacity-40 cursor-not-allowed' :
                            activeTab === item.id
                              ? 'border-[#403E34] text-[#403E34]'
                              : 'border-[#737065] text-[#737065] hover:border-[#403E34] hover:text-[#403E34]'}
                          ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
               style={{
                 backgroundColor: activeTab === item.id ? '#BFBAA8' : 'rgba(217,215,197,0.85)',
               }}
             >
               <item.icon className="w-3.5 h-3.5" />
               {/* Tooltip */}
               {!isDevMode && (
                 <span className="absolute left-full ml-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border pointer-events-none font-mono"
                   style={{ backgroundColor: '#D9D7C5', color: '#403E34', borderColor: '#737065' }}>
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
            className={`relative group flex items-center justify-center w-9 h-9 border rounded-xl transition-colors shadow-sm backdrop-blur-sm pointer-events-auto
              ${activeTab === 'npc' ? 'border-[#403E34] text-[#403E34]' : 'border-[#737065] text-[#737065] hover:border-[#403E34] hover:text-[#403E34]'}
              ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
            style={{ backgroundColor: activeTab === 'npc' ? '#BFBAA8' : 'rgba(217,215,197,0.85)' }}
          >
            <Wrench className="w-3.5 h-3.5" />
            {!isDevMode && (
              <span className="absolute left-full ml-3 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-xs font-mono border"
                style={{ backgroundColor: '#D9D7C5', color: '#403E34', borderColor: '#737065' }}>
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
            className={`relative group flex items-center justify-center w-9 h-9 rounded-xl transition-colors shadow-lg backdrop-blur-sm pointer-events-auto
              ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
          >
            <Crown className="w-3.5 h-3.5" />
            {!isDevMode && (
              <span className="absolute left-full ml-3 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-xs font-mono"
                style={{ backgroundColor: '#1a0505', color: '#fca5a5', border: `1px solid ${FACTION_COLORS.leaderEvil}` }}>
                {currentUser?.faction === 'Pure' ? '教廷面板' : '惡政面板'}
              </span>
            )}
          </DraggableUIButton>
        )}
      </div>

      {/* 2. Top Right: Currency & Profile */}
      <div className="fixed top-6 right-8 z-[100] flex items-center gap-6">
        {/* Currency Display */}
        {currentUser && (
          <div className="flex items-center gap-4 px-4 py-2 rounded-full border backdrop-blur-md"
            style={{ backgroundColor: 'rgba(217,215,197,0.9)', borderColor: '#737065' }}>
            <div className="flex items-center gap-2" title={getCurrencyName()}>
              {React.createElement(getCurrencyIcon(), { className: 'w-2 h-2', style: { color: '#8a7040' } })}
              <span className="text-sm font-mono" style={{ color: '#403E34' }}>
                {currentUser.coins || 0}
              </span>
            </div>
          </div>
        )}

        {/* Login/User Button */}
        <button
          onClick={() => currentUser ? setCharacterCardTarget(currentUser.oc_name) : setShowLogin(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all group"
          style={{ backgroundColor: 'rgba(217,215,197,0.9)', borderColor: '#737065' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#403E34'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#737065'; }}
        >
          <div className={`w-2 h-2 rounded-full ${currentUser ? 'bg-green-600 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm tracking-wider uppercase" style={{ color: '#403E34' }}>
            {currentUser ? currentUser.oc_name : 'TERMINAL DISCONNECTED'}
          </span>
          <User className="w-3 h-3" style={{ color: '#737065' }} />
        </button>

        {/* Notification Bell */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(prev => !prev)}
              className="relative p-2 rounded-full border transition-all"
              style={{ backgroundColor: 'rgba(217,215,197,0.9)', borderColor: '#737065', color: '#737065' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#403E34'; e.currentTarget.style.color = '#403E34'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#737065'; e.currentTarget.style.color = '#737065'; }}
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
                className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto rounded border z-[80] flex flex-col custom-scrollbar"
                style={{ backgroundColor: '#D9D7C5', borderColor: '#737065' }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: '#BFBAA8' }}>
                  <span className="text-[11px] tracking-[0.2em] uppercase font-mono" style={{ color: '#737065' }}>通知記錄</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-[10px] tracking-widest transition-colors"
                      style={{ color: '#737065' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#403E34')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#737065')}
                    >
                      全部已讀
                    </button>
                  )}
                </div>
                {notifications.filter(n => n.notification_type === 'private').length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs italic font-mono" style={{ color: '#BFBAA8' }}>
                    暫無通知
                  </div>
                ) : (
                  <div style={{ borderColor: '#BFBAA8' }}>
                    {notifications
                      .filter(n => n.notification_type === 'private')
                      .slice(0, 20)
                      .map(n => (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && markRead(n.id)}
                          className={`px-4 py-3 cursor-pointer transition-colors border-b ${n.is_read ? 'opacity-40' : ''}`}
                          style={{ borderColor: '#BFBAA8' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#BFBAA8')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <p className="text-xs font-mono leading-relaxed" style={{ color: '#403E34' }}>{n.content}</p>
                          <p className="text-[10px] mt-1 font-mono" style={{ color: '#737065' }}>
                            {new Date(n.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            {!n.is_read && <span className="ml-2" style={{ color: '#8a7040' }}>●</span>}
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
          style={{ backgroundColor: 'rgba(217,215,197,0.9)', borderColor: '#737065', color: '#737065' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#403E34'; e.currentTarget.style.color = '#403E34'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#737065'; e.currentTarget.style.color = '#737065'; }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Developer Mode Toggle */}
        {currentUser && (currentUser.oc_name || '').toLowerCase() === 'vonn' && (
          <button
            onClick={() => setIsDevMode(!isDevMode)}
            className={`p-2 border rounded-full transition-all flex items-center gap-2 px-3
              ${isDevMode ? 'bg-cyan-900/40 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'border-[#737065] text-[#737065] hover:text-[#403E34]'}`}
            style={isDevMode ? {} : { backgroundColor: 'rgba(217,215,197,0.9)' }}
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
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-lg backdrop-blur-sm mx-auto
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
      <AnimatePresence>
        {activeTab && activeTab !== 'none' && (
          <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-start pl-20" style={{ pointerEvents: 'auto' }}>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="w-[450px] backdrop-blur-md flex flex-col p-6 shadow-2xl h-[calc(100vh-160px)]"
              style={{
                backgroundColor: activeTab === 'tyranny' ? 'rgba(5,0,0,0.97)' : '#D9D7C5',
                border: activeTab === 'tyranny' ? `1px dashed ${FACTION_COLORS.leaderEvil}` : `1px solid #737065`,
                boxShadow: activeTab === 'tyranny' ? `0 0 40px ${FACTION_COLORS.leaderEvil}22, inset 0 0 60px ${FACTION_COLORS.leaderEvil}08` : '0 8px 40px rgba(64,62,52,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4"
                style={{ borderBottom: activeTab === 'tyranny' ? `1px dashed ${FACTION_COLORS.leaderEvil}66` : '1px solid #BFBAA8' }}>
              <h3 className="text-xl tracking-[0.2em] font-serif italic"
                style={{ color: activeTab === 'tyranny' ? '#dc2626' : '#403E34' }}>
                {activeTab === 'announcement' && '觀測日誌'}
                {activeTab === 'quest' && '任務徵集'}
                {activeTab === 'daily' && '靈魂足跡'}
                {activeTab === 'collection' && '萬象圖鑑'}
                {activeTab === 'inventory' && '混沌背包'}
                {activeTab === 'settings' && '儀式設定'}
                {activeTab === 'npc' && 'NPC面板'}
                {activeTab === 'tyranny' && (currentUser?.faction === 'Pure' ? '教廷面板' : '惡政面板')}
              </h3>
              <button onClick={() => setActiveTab(null)} className="transition-colors" style={{ color: '#737065' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#403E34')}
                onMouseLeave={e => (e.currentTarget.style.color = '#737065')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              {/* --- 公告 (Announcement) --- */}
              {activeTab === 'announcement' && (
                <div className="space-y-8">
                  {announcements.map(a => (
                    <div key={a.id} className="space-y-3 group">
                      <div className="flex justify-between items-end">
                        <h4 className="text-sm font-bold tracking-wider transition-colors" style={{ color: '#403E34' }}>{a.title}</h4>
                        <span className="text-[10px] font-mono" style={{ color: '#737065' }}>{a.date}</span>
                      </div>
                      <p className="text-sm leading-loose font-serif border-l-2 pl-4 transition-colors"
                        style={{ color: '#737065', borderColor: '#BFBAA8' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#737065'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#BFBAA8'; }}>
                        {a.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* --- 任務 (Quest) --- */}
              {activeTab === 'quest' && (
                <div className="h-full flex flex-col">
                  {/* Sub-tabs */}
                  <div className="flex mb-6" style={{ borderBottom: '1px solid #BFBAA8' }}>
                    <button
                      onClick={() => setQuestTab('recruitment')}
                      className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors`}
                      style={{
                        color: questTab === 'recruitment' ? '#403E34' : '#737065',
                        borderBottom: questTab === 'recruitment' ? '2px solid #403E34' : 'none',
                      }}
                    >
                      現有任務
                    </button>
                    <button
                      onClick={() => setQuestTab('reporting')}
                      className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors`}
                      style={{
                        color: questTab === 'reporting' ? '#403E34' : '#737065',
                        borderBottom: questTab === 'reporting' ? '2px solid #403E34' : 'none',
                      }}
                    >
                      回報任務
                    </button>
                  </div>

                  {questTab === 'recruitment' && (
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                      {missions
                        .filter(m => m.faction === 'Common' || m.faction === playerFaction)
                        .map(m => (
                        <div key={m.id} className={`p-4 border transition-all`}
                          style={{
                            borderColor: m.status === 'full' ? '#BFBAA8' : '#737065',
                            backgroundColor: m.status === 'full' ? 'rgba(191,186,168,0.3)' : 'rgba(217,215,197,0.6)',
                          }}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-md font-serif" style={{ color: m.status === 'full' ? '#737065' : '#403E34' }}>{m.title}</h4>
                            <span className={`text-xs px-2 py-1 border ${m.faction === 'Turbid' ? 'border-purple-400 text-purple-600' : m.faction === 'Pure' ? 'border-amber-500 text-amber-600' : 'border-[#737065] text-[#737065]'}`}>
                              {m.faction}
                            </span>
                          </div>
                          <p className="text-sm mb-4 font-light leading-relaxed" style={{ color: '#737065' }}>{m.description}</p>

                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono" style={{ color: '#737065' }}>
                              {m.type === 'main' ? (
                                <>人員: <span style={{ color: m.status === 'full' ? '#c0392b' : '#403E34' }}>({m.current}/{m.max})</span></>
                              ) : (
                                <>匯聚人數: <span style={{ color: '#403E34' }}>{m.current} / ∞</span></>
                              )}
                            </span>
                            <button
                              onClick={() => handleMissionJoin(m)}
                              disabled={m.type === 'main' && (m.status === 'full' || hasReportedMain)}
                              className={`px-4 py-1 text-xs tracking-widest uppercase transition-colors border`}
                              style={{
                                backgroundColor: m.type === 'main' && m.status === 'full'
                                  ? '#BFBAA8' : m.type === 'main' && hasReportedMain
                                  ? '#BFBAA8' : m.type === 'main' && isLocked
                                  ? '#BFBAA8' : '#403E34',
                                color: m.type === 'main' && (m.status === 'full' || hasReportedMain || isLocked)
                                  ? '#737065' : '#D9D7C5',
                                borderColor: m.type === 'main' && (m.status === 'full' || hasReportedMain || isLocked)
                                  ? '#737065' : '#403E34',
                                cursor: m.type === 'main' && (m.status === 'full' || hasReportedMain) ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {m.type === 'main' && m.status === 'full' ? '已滿額' 
                               : m.type === 'main' && hasReportedMain ? '已記錄'
                               : m.type === 'main' && isLocked ? '鎖定中' 
                               : '參與'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {questTab === 'reporting' && (
                    <div className="space-y-6">
                      <div className="p-4 border" style={{ backgroundColor: 'rgba(191,186,168,0.3)', borderColor: '#737065' }}>
                        <label className="text-xs uppercase tracking-widest mb-2 block" style={{ color: '#737065' }}>Mission Subject</label>
                        <input
                          type="text"
                          value={reportSubject}
                          onChange={(e) => setReportSubject(e.target.value)}
                          placeholder="[章節]-[據點名稱]-[OC名稱]"
                          className="w-full p-3 focus:outline-none transition-colors text-sm font-mono mb-4"
                          style={{ backgroundColor: '#D9D7C5', border: '1px solid #737065', color: '#403E34' }}
                        />
                        <p className="text-[10px] mb-6 font-mono" style={{ color: '#737065' }}>
                          * 格式範例：第一章-荒原裂隙-塞理安<br/>
                          * 請確認據點名稱與當前位置一致。
                        </p>
                        <button
                          onClick={handleReportSubmit}
                          className="w-full py-2 text-xs font-bold tracking-widest uppercase transition-colors"
                          style={{ backgroundColor: '#403E34', color: '#D9D7C5', border: '1px solid #403E34' }}
                        >
                          Submit Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- 日誌 (Daily/Echoes) --- */}
              {activeTab === 'daily' && (
                <div className="h-full flex flex-col">
                  {/* Sub-tabs */}
                  <div className="flex mb-6" style={{ borderBottom: '1px solid #BFBAA8' }}>
                    <button
                      onClick={() => setDailyTab('echoes')}
                      className="flex-1 py-2 text-xs uppercase tracking-widest transition-colors"
                      style={{
                        color: dailyTab === 'echoes' ? '#403E34' : '#737065',
                        borderBottom: dailyTab === 'echoes' ? '2px solid #403E34' : 'none',
                      }}
                    >
                      小道消息
                    </button>
                    <button
                      onClick={() => setDailyTab('snippets')}
                      className="flex-1 py-2 text-xs uppercase tracking-widest transition-colors"
                      style={{
                        color: dailyTab === 'snippets' ? '#403E34' : '#737065',
                        borderBottom: dailyTab === 'snippets' ? '2px solid #403E34' : 'none',
                      }}
                    >
                      觀察日報
                    </button>
                  </div>

                  {dailyTab === 'echoes' && (
                    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0800' }}>

                      {/* Header: entry count */}
                      <div className="flex items-center justify-between px-4 py-2 shrink-0"
                        style={{ borderBottom: '1px solid #1e1800' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 rounded-sm" style={{ backgroundColor: '#e8813a' }} />
                          <span className="text-[9px] tracking-[0.4em] uppercase font-mono" style={{ color: '#c9a84c' }}>
                            GAZETTE
                          </span>
                        </div>
                        {!gazetteLoading && (
                          <span className="text-[9px] font-mono" style={{ color: '#3a2a18' }}>
                            {gazetteEntries.length} 則
                          </span>
                        )}
                      </div>

                      {/* Entries */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {gazetteLoading && (
                          <p className="text-center text-[10px] tracking-[0.3em] animate-pulse mt-12 font-mono" style={{ color: '#3a2a18' }}>
                            ◈ 傳訊中 ◈
                          </p>
                        )}
                        {!gazetteLoading && gazetteEntries.length === 0 && (
                          <div className="text-center mt-12 space-y-1.5">
                            <p className="text-[10px] tracking-[0.4em] uppercase font-mono" style={{ color: '#2a1e10' }}>— NO RECORDS —</p>
                            <p className="text-[11px]" style={{ color: '#2a1e10' }}>尚無任何消息流傳</p>
                          </div>
                        )}

                        {gazetteEntries.map((entry) => {
                          const timeStr = new Date(entry.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                          const accentTurbid = FACTION_COLORS.Turbid.highlight;
                          const accentPure = FACTION_COLORS.Pure.highlight;
                          const leaderAccent = entry.faction === 'Turbid' ? accentTurbid : accentPure;

                          // ── 領主敕令 ──────────────────────────────────────────
                          if (entry.gazette_type === 'leader') {
                            return (
                              <div
                                key={entry.id}
                                className="mx-3 my-2 px-3 py-3"
                                style={{
                                  borderLeft: `2px solid ${leaderAccent}`,
                                  backgroundColor: `${leaderAccent}0d`,
                                  outline: `1px solid ${leaderAccent}20`,
                                  outlineOffset: '-1px',
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className="text-[9px] font-mono tracking-[0.25em] uppercase px-1.5 py-0.5"
                                    style={{
                                      color: leaderAccent,
                                      border: `1px solid ${leaderAccent}45`,
                                      backgroundColor: `${leaderAccent}0d`,
                                    }}
                                  >
                                    ✦ 領主敕令
                                  </span>
                                  <span className="text-[9px] font-mono tabular-nums" style={{ color: `${leaderAccent}55` }}>{timeStr}</span>
                                </div>
                                <p className="text-[13px] leading-relaxed" style={{ color: `${leaderAccent}dd`, lineHeight: '1.6' }}>
                                  {entry.gazette_content}
                                </p>
                              </div>
                            );
                          }

                          // ── 系統公告 ──────────────────────────────────────────
                          if (entry.gazette_type === 'system') {
                            return (
                              <div
                                key={entry.id}
                                className="flex items-baseline gap-3 px-4 py-2"
                                style={{ borderBottom: '1px solid #140f00' }}
                              >
                                <span className="text-[10px] shrink-0 font-mono" style={{ color: '#2e2010' }}>SYS</span>
                                <p className="flex-1 text-[11px] leading-relaxed" style={{ color: '#4a3820', fontStyle: 'italic' }}>
                                  {entry.gazette_content}
                                </p>
                                <span className="text-[9px] font-mono tabular-nums shrink-0" style={{ color: '#2a1e10' }}>{timeStr}</span>
                              </div>
                            );
                          }

                          // ── 任務動態 ──────────────────────────────────────────
                          const missionText = entry.gazette_content
                            || (entry.oc_name && entry.landmark_id
                              ? `${entry.oc_name} 在 ${entry.landmark_id} 完成了任務`
                              : `${entry.oc_name || '未知玩家'} 完成了任務`);

                          return (
                            <div
                              key={entry.id}
                              className="flex items-baseline gap-3 px-4 py-2.5"
                              style={{ borderBottom: '1px solid #140f00' }}
                            >
                              <span className="text-[9px] shrink-0 font-mono mt-px" style={{ color: '#e8813a50' }}>▸</span>
                              <p className="flex-1 text-[12px] leading-relaxed" style={{ color: '#b89060', lineHeight: '1.55' }}>
                                {missionText}
                              </p>
                              <span className="text-[9px] font-mono tabular-nums shrink-0" style={{ color: '#4a3010' }}>{timeStr}</span>
                            </div>
                          );
                        })}

                        {/* Footer rule when populated */}
                        {!gazetteLoading && gazetteEntries.length > 0 && (
                          <div className="flex items-center gap-3 mx-4 my-3">
                            <div className="flex-1 h-px" style={{ backgroundColor: '#1e1800' }} />
                            <span className="text-[8px] tracking-[0.5em] font-mono" style={{ color: '#2a1e10' }}>◆ END ◆</span>
                            <div className="flex-1 h-px" style={{ backgroundColor: '#1e1800' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {dailyTab === 'snippets' && (
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {dailySnippets.map((snippet) => (
                        <div key={snippet.id} className="p-4 border relative group transition-colors"
                          style={{ backgroundColor: 'rgba(191,186,168,0.3)', borderColor: '#BFBAA8' }}>
                          <p className="text-sm font-serif mb-3 leading-relaxed" style={{ color: '#403E34' }}>
                            {snippet.content}
                          </p>
                          <div className="flex justify-end items-center">
                            <button
                              onClick={() => handleLikeSnippet(snippet.id)}
                              className="flex items-center gap-1.5 text-xs transition-colors"
                              style={{ color: snippet.isLiked ? '#c0392b' : '#737065' }}
                            >
                              <Heart className={`w-3 h-3 ${snippet.isLiked ? 'fill-current' : ''}`} />
                              <span className="font-mono">{snippet.likes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- 圖鑑 (Collection) --- */}
              {activeTab === 'collection' && (
                <div className="h-full flex flex-col">
                  {/* Sub-tabs */}
                  <div className="flex mb-6" style={{ borderBottom: '1px solid #BFBAA8' }}>
                    {(['raiment', 'fragments', 'relics'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setCollectionTab(tab)}
                        className="flex-1 py-2 text-xs uppercase tracking-widest transition-colors"
                        style={{
                          color: collectionTab === tab ? '#403E34' : '#737065',
                          borderBottom: collectionTab === tab ? '2px solid #403E34' : 'none',
                        }}
                      >
                        {tab === 'raiment' ? '衣服' : tab === 'fragments' ? '碎片' : '遺物'}
                      </button>
                    ))}
                  </div>

                  {collectionTab === 'raiment' && (
                    <div className="mb-6 p-6 border text-center"
                      style={{ backgroundColor: 'rgba(191,186,168,0.3)', borderColor: '#BFBAA8' }}>
                       <p className="text-xs font-serif mb-4 italic leading-relaxed" style={{ color: '#737065' }}>
                         『命運的輪盤已不再此處轉動...<br/>
                         舊日的衣裝已悉數移往據點商店。』
                       </p>
                       <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: '#737065' }}>
                         <Settings className="w-3 h-3 animate-spin-slow" />
                         Transferred to Landmark Shop
                       </div>
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-2 gap-4 content-start overflow-y-auto pr-2 custom-scrollbar">
                     {[1, 2, 3, 4].map(i => (
                       <div key={i} className="aspect-square border flex flex-col items-center justify-center gap-2 group transition-colors cursor-pointer"
                         style={{ backgroundColor: 'rgba(191,186,168,0.2)', borderColor: '#BFBAA8' }}>
                          {collectionTab === 'raiment' && <Shirt className="w-6 h-6" style={{ color: '#BFBAA8' }} />}
                          {collectionTab === 'fragments' && <Puzzle className="w-6 h-6" style={{ color: '#BFBAA8' }} />}
                          {collectionTab === 'relics' && <Hourglass className="w-6 h-6" style={{ color: '#BFBAA8' }} />}
                          <span className="text-[10px] uppercase" style={{ color: '#737065' }}>Unknown #{i}</span>
                       </div>
                     ))}
                  </div>

                  <p className="mt-6 text-[10px] text-center pt-4" style={{ color: '#737065', borderTop: '1px solid #BFBAA8' }}>
                    * 圖片僅留存於 QQ 群聊相本，此處僅供感官回溯。
                  </p>
                </div>
              )}

              {/* --- 背包 (Inventory) --- */}
              {activeTab === 'inventory' && (
                <div className="h-full flex flex-col">
                  {/* Currency Header */}
                  <div className="flex gap-4 mb-6 p-4 border" style={{ backgroundColor: 'rgba(191,186,168,0.3)', borderColor: '#BFBAA8' }}>
                    <div className="flex-1 flex items-center gap-2">
                       <Coins className="w-3 h-3" style={{ color: '#403E34' }} />
                       <div>
                        <div className="text-[10px] uppercase" style={{ color: '#737065' }}>貨幣</div>
                         <div className="text-lg font-mono" style={{ color: '#403E34' }}>{currentUser?.coins || 0}</div>
                       </div>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <div className="text-xs uppercase" style={{ color: '#737065' }}>
                        Capacity: <span style={{ color: currentUser?.inventory && currentUser.inventory.length >= MAX_INVENTORY_SIZE ? '#c0392b' : '#403E34' }}>
                          {currentUser?.inventory?.length || 0}/{MAX_INVENTORY_SIZE}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid or Empty State */}
                  {currentUser?.inventory && currentUser.inventory.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                       {currentUser.inventory.map((item, i) => (
                         <div key={i} className="aspect-square border flex items-center justify-center relative group"
                           style={{ backgroundColor: 'rgba(191,186,168,0.2)', borderColor: '#BFBAA8' }}>
                           <div className="w-8 h-8 rounded-full opacity-50" style={{ backgroundColor: '#BFBAA8' }}></div>
                           <span className="absolute bottom-1 right-1 text-[8px]" style={{ color: '#737065' }}>x1</span>
                         </div>
                       ))}
                       {Array.from({ length: Math.max(0, MAX_INVENTORY_SIZE - (currentUser.inventory.length)) }).map((_, i) => (
                         <div key={`empty-${i}`} className="aspect-square border" style={{ backgroundColor: 'rgba(217,215,197,0.3)', borderColor: '#BFBAA8' }}></div>
                       ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                       <div className="w-16 h-16 border rounded-full flex items-center justify-center mb-4" style={{ borderColor: '#BFBAA8' }}>
                         <span className="text-2xl">💨</span>
                       </div>
                       <p className="text-sm font-serif italic" style={{ color: '#737065' }}>
                         「行囊空空如也，<br/>唯有風聲在其中迴盪。」
                       </p>
                    </div>
                  )}

                  <div className="mt-8 pt-5" style={{ borderTop: '1px solid #BFBAA8' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs tracking-[0.2em] uppercase" style={{ color: '#403E34' }}>市集</span>
                      <button
                        onClick={fetchMarket}
                        className="text-[10px] transition-colors"
                        style={{ color: '#737065' }}
                      >
                        重新整理
                      </button>
                    </div>
                    {marketError && <p className="text-[11px] text-red-500 mb-2">{marketError}</p>}
                    {marketLoading ? (
                      <p className="text-xs" style={{ color: '#737065' }}>載入中...</p>
                    ) : marketSlots.length === 0 ? (
                      <p className="text-xs italic" style={{ color: '#737065' }}>目前沒有可購買的商品</p>
                    ) : (
                      <div className="space-y-2">
                        {marketSlots.map(slot => {
                          const displayName = slot.custom_name || slot.item_id || slot.item_type;
                          const isSelf = slot.seller_oc === currentUser?.oc_name;
                          const disabled = buyingSlotId === slot.id || isSelf || !!currentUser?.npc_role;
                          return (
                            <div key={slot.id} className="flex items-center justify-between gap-3 p-3 border"
                              style={{ borderColor: '#BFBAA8', backgroundColor: 'rgba(191,186,168,0.2)' }}>
                              <div className="min-w-0">
                                <p className="text-sm truncate" style={{ color: '#403E34' }}>{displayName}</p>
                                <p className="text-[10px]" style={{ color: '#737065' }}>{slot.item_type}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-mono" style={{ color: '#403E34' }}>{slot.price} 貨幣</span>
                                <button
                                  onClick={() => handleBuyItem(slot)}
                                  disabled={disabled}
                                  className="text-[10px] px-3 py-1 border transition-colors"
                                  style={{
                                    borderColor: disabled ? '#BFBAA8' : '#403E34',
                                    color: disabled ? '#737065' : '#403E34',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {buyingSlotId === slot.id ? '處理中' : isSelf ? '自家商品' : currentUser?.npc_role ? '不可購買' : '購買'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-5" style={{ borderTop: '1px solid #BFBAA8' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs tracking-[0.2em] uppercase" style={{ color: '#403E34' }}>寵物商店</span>
                      <button
                        onClick={fetchPets}
                        className="text-[10px] transition-colors"
                        style={{ color: '#737065' }}
                      >
                        重新整理
                      </button>
                    </div>
                    {petsError && <p className="text-[11px] text-red-500 mb-2">{petsError}</p>}
                    {petsLoading ? (
                      <p className="text-xs" style={{ color: '#737065' }}>載入中...</p>
                    ) : shopPets.length === 0 ? (
                      <p className="text-xs italic" style={{ color: '#737065' }}>目前沒有可購買的寵物</p>
                    ) : (
                      <div className="space-y-2">
                        {shopPets.map(p => {
                          const disabled = buyingPetId === p.id || !!currentUser?.npc_role;
                          return (
                            <div key={p.id} className="flex items-center justify-between gap-3 p-3 border"
                              style={{ borderColor: '#BFBAA8', backgroundColor: 'rgba(191,186,168,0.2)' }}>
                              <div className="min-w-0">
                                <p className="text-sm truncate" style={{ color: '#403E34' }}>{p.name}</p>
                                <p className="text-[10px] truncate" style={{ color: '#737065' }}>{p.description}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-mono" style={{ color: '#403E34' }}>{p.price} 貨幣</span>
                                <button
                                  onClick={() => handleBuyPet(p)}
                                  disabled={disabled}
                                  className="text-[10px] px-3 py-1 border transition-colors"
                                  style={{
                                    borderColor: disabled ? '#BFBAA8' : '#403E34',
                                    color: disabled ? '#737065' : '#403E34',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {buyingPetId === p.id ? '處理中' : currentUser?.npc_role ? '不可購買' : '購買'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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

              {/* --- 設定 (Settings) --- */}
              {activeTab === 'settings' && (
                <div className="space-y-8 py-4">
                   {/* BGM Volume */}
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs uppercase tracking-widest" style={{ color: '#403E34' }}>
                        <span className="flex items-center gap-2"><Music className="w-3 h-3" /> BGM Volume</span>
                        <span className="font-mono">{bgmVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0" max="100"
                        value={bgmVolume}
                        onChange={(e) => setBgmVolume(Number(e.target.value))}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full"
                        style={{ backgroundColor: '#BFBAA8', ['--thumb-color' as string]: '#403E34' }}
                      />
                   </div>

                   {/* SFX Volume */}
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs uppercase tracking-widest" style={{ color: '#403E34' }}>
                        <span className="flex items-center gap-2"><Volume2 className="w-3 h-3" /> SFX Volume</span>
                        <span className="font-mono">{sfxVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0" max="100"
                        value={sfxVolume}
                        onChange={(e) => setSfxVolume(Number(e.target.value))}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full"
                        style={{ backgroundColor: '#BFBAA8' }}
                      />
                   </div>

                   <div className="pt-4 space-y-4" style={{ borderTop: '1px solid #BFBAA8' }}>
                     <p className="text-[10px] text-center font-mono" style={{ color: '#737065' }}>
                       SACRED CANVAS HELPER v1.0<br/>
                       SYSTEM INTEGRITY: STABLE
                     </p>
                   </div>
                </div>
              )}

            </div>
          </motion.div>
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
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setDriftModalOpen(false)}
          >
            <div className="w-[500px] p-8 shadow-2xl relative" style={{ backgroundColor: '#D9D7C5', border: '1px solid #737065' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-serif text-center tracking-widest mb-6" style={{ color: '#403E34' }}>刻寫殘卷</h3>

              <div className="min-h-[100px] p-4 mb-6 flex flex-wrap gap-2 items-start content-start" style={{ border: '1px solid #BFBAA8', backgroundColor: 'rgba(191,186,168,0.3)' }}>
                {driftMessage.length > 0 ? (
                  driftMessage.map((word, idx) => (
                    <span key={idx} className="px-2 py-1 text-sm font-mono" style={{ backgroundColor: '#403E34', color: '#D9D7C5' }}>{word}</span>
                  ))
                ) : (
                  <span className="text-sm italic" style={{ color: '#737065' }}>請從下方選擇詞彙拼湊訊息...</span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-8">
                {wordBank.map(word => (
                  <button
                    key={word}
                    onClick={() => handleWordSelect(word)}
                    disabled={driftMessage.length >= 5}
                    className="py-2 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ border: '1px solid #BFBAA8', color: '#403E34', backgroundColor: 'transparent' }}
                  >
                    {word}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6" style={{ borderTop: '1px solid #BFBAA8' }}>
                <button
                  onClick={() => setDriftMessage([])}
                  className="text-xs transition-colors"
                  style={{ color: '#737065' }}
                >
                  清除重寫
                </button>
                <div className="flex gap-4">
                  <span className="text-xs flex items-center gap-1" style={{ color: '#737065' }}>
                    消耗: <span style={{ color: currentUser && currentUser.coins >= 5 ? '#403E34' : '#c0392b' }}>5</span> <Coins className="w-2 h-2" style={{ color: '#403E34' }} />
                  </span>
                  <div className="px-6 py-2 text-xs font-mono" style={{ color: '#737065' }}>此功能已停用</div>
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
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="w-[400px] p-8 relative overflow-hidden shadow-2xl" style={{ backgroundColor: '#D9D7C5', border: '1px solid #737065' }}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BFBAA8] to-transparent" />
              <h3 className="text-xl font-light text-center tracking-[0.3em] mb-3 font-serif" style={{ color: '#403E34' }}>
                SET PASSCODE
              </h3>
              <p className="text-xs text-center mb-8 font-mono leading-relaxed px-4" style={{ color: '#737065' }}>
                首次連結偵測。<br />
                請設定你的專屬四位數字密鑰，<br />
                此後將以此作為唯一憑證。
              </p>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest" style={{ color: '#737065' }}>New Passcode</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full p-3 focus:outline-none transition-colors text-sm font-mono tracking-[0.5em]"
                    style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest" style={{ color: '#737065' }}>Confirm Passcode</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full p-3 focus:outline-none transition-colors text-sm font-mono tracking-[0.5em]"
                    style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                  />
                </div>
                {setPasswordError && (
                  <p className="text-xs font-mono text-red-600">{setPasswordError}</p>
                )}
                <button
                  onClick={handleSetPassword}
                  className="w-full py-3 mt-2 text-sm font-bold tracking-widest uppercase transition-colors"
                  style={{ backgroundColor: '#403E34', color: '#D9D7C5' }}
                >
                  Confirm & Connect
                </button>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BFBAA8] to-transparent" />
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

    </div>
  );
};
