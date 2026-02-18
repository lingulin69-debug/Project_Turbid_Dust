import React, { useState, useEffect, useRef } from 'react';
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
  Cloud,
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
  Gift,
  Heart,
  Activity
} from 'lucide-react';
import { ApostateSystem, ApostateGeometryIcon } from './ApostateSystem';
import { AdminApostateControl } from './AdminApostateControl';
import { LiquidatorSystem, LiquidatorLensIcon } from './LiquidatorSystem';
import { DevControlPanel } from './DevControlPanel';

import { MapLandmark, LandmarkData, LandmarkType } from './MapLandmark';
import { CentralBalanceScale } from './CentralBalanceScale';
import { DraggableUIButton } from './DraggableUIButton';
import { FogLayer } from './FogLayer';
import { DesignOverlay } from './DesignOverlay';
import { LoginModal } from './auth/LoginModal';

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

interface EchoLog {
  id: string;
  content: string;
  timestamp: string;
  faction: 'Turbid' | 'Pure';
  minutesAgo: number;
}

const echoLogs: EchoLog[] = [
  { id: 'e1', content: '[玩家 B] 於 10 分鐘前在純塵祭壇點燃了微光。', timestamp: '10:30', faction: 'Pure', minutesAgo: 10 },
  { id: 'e2', content: '[玩家 A] 於 30 分鐘前觀測到了異常波動。', timestamp: '10:10', faction: 'Pure', minutesAgo: 30 },
  { id: 'e3', content: '[Unknown] 於 1 小時前嘗試穿越迷霧失敗。', timestamp: '09:40', faction: 'Pure', minutesAgo: 60 },
  { id: 'e4', content: '[玩家 C] 於 5 分鐘前在舊觀測站發現了新的裂隙。', timestamp: '10:35', faction: 'Turbid', minutesAgo: 5 },
  { id: 'e5', content: '[玩家 D] 於 20 分鐘前被濁息吞噬了理智...暫時。', timestamp: '10:20', faction: 'Turbid', minutesAgo: 20 },
];

export const MapTestView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [playerFaction, setPlayerFaction] = useState<'Turbid' | 'Pure' | 'Common'>('Common');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(true); // Default true for Gatekeeper
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
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

  // Drift Bottle (Lost Fragments) State
  const [isDriftMode, setIsDriftMode] = useState(false);
  const [driftMessage, setDriftMessage] = useState<string[]>([]);
  const [driftModalOpen, setDriftModalOpen] = useState(false);
  const [placedFragments, setPlacedFragments] = useState<{id: string, x: number, y: number, content: string, sender: string}[]>([]);
  const [selectedFragment, setSelectedFragment] = useState<{id: string, content: string, sender: string} | null>(null);

  // 1999 Style Word Bank
  const wordBank = ['遺忘', '霧中', '鐘聲', '等待', '微光', '廢墟', '回響', '深淵', '重逢', '破碎', '時間', '雨聲', '沉默', '歸途', '星辰', '灰燼'];

  // Mission & Reporting State
  const [questTab, setQuestTab] = useState<'recruitment' | 'reporting'>('recruitment');
  const [reportSubject, setReportSubject] = useState('');
  const [isLocked, setIsLocked] = useState(false); // 報名鎖定機制 (已參與但未回報)
  const [hasReportedMain, setHasReportedMain] = useState(false); // 是否已完成當前版本主線回報

  // Breathing Icon State (Performance Optimized)
  const [hasUnclaimedGift, setHasUnclaimedGift] = useState(false);
  const CURRENT_CHAPTER = '1.0';
  
  // Exhale (Gift Giving) State
  const [exhaleModalOpen, setExhaleModalOpen] = useState(false);
  const [selectedExhaleItem, setSelectedExhaleItem] = useState<string | null>(null);
  const [exhaleMessage, setExhaleMessage] = useState('');

  // Apostate System State
  const [apostateMenuOpen, setApostateMenuOpen] = useState(false);
  const [liquidatorMenuOpen, setLiquidatorMenuOpen] = useState(false);
  
  // 2. 天平核心計演算法 (Tilt Algorithm)
  // 0-100, 50 = Balanced
  const [balanceWeight, setBalanceWeight] = useState(50);
  
  // Breathing Gift Items (Limited List)
  const BREATHING_ITEMS = [
    { id: 'B001', name: '微光燈蕊', cost: 1 },
    { id: 'B002', name: '苦澀乾果', cost: 1 },
    { id: 'B003', name: '鏽蝕齒輪', cost: 1 },
    { id: 'B004', name: '純塵纖維', cost: 1 },
    { id: 'B005', name: '濁息殘片', cost: 1 },
    { id: 'B006', name: '泛黃信封', cost: 1 },
    { id: 'B007', name: '2 枚殘幣', cost: 2 }, // Special: Direct Coin Transfer
  ];

  // Check for unclaimed gifts on mount or login
  useEffect(() => {
    if (currentUser) {
       // Mock check logic
       const claimed = localStorage.getItem(`gift_claimed_${currentUser.oc_name}_${CURRENT_CHAPTER}`);
       setHasUnclaimedGift(!claimed);
    }
  }, [currentUser]);

  const handleInhale = () => {
    if (!currentUser) return;
    
    // Inhale Logic (Claim Gift)
    const REWARD_COINS = Math.floor(Math.random() * 2) + 1; // 1-2 coins
    const REWARD_ITEM = 'B001'; // Example item

    setCurrentUser(prev => prev ? ({ 
      ...prev, 
      coins: prev.coins + REWARD_COINS,
      inventory: [...prev.inventory, REWARD_ITEM]
    }) : null);
    
    // Mark as claimed
    localStorage.setItem(`gift_claimed_${currentUser.oc_name}_${CURRENT_CHAPTER}`, 'true');
    setHasUnclaimedGift(false);
    
    alert(`『捕捉到一段跨越荒原的頻率。』\n(已吸入：微光燈蕊 + ${REWARD_COINS} 殘幣)`);
  };

  const handleExhale = () => {
    if (!currentUser) return;
    if (!selectedExhaleItem) {
      alert('請選擇一份微薄的贈禮。');
      return;
    }
    
    const item = BREATHING_ITEMS.find(i => i.id === selectedExhaleItem);
    if (!item) return;

    if (currentUser.coins < item.cost) {
      alert('您的行囊太輕，無法承擔這份饋贈的重量。');
      return;
    }

    // Deduct cost
    setCurrentUser(prev => prev ? ({ ...prev, coins: prev.coins - item.cost }) : null);
    
    // Update Balance Scale
    const TILT_AMOUNT = item.cost * 1.0;
    const direction = playerFaction === 'Pure' ? 1 : -1;
    setBalanceWeight(prev => Math.min(100, Math.max(0, prev + (TILT_AMOUNT * direction))));
    
    setExhaleModalOpen(false);
    setSelectedExhaleItem(null);
    setExhaleMessage('');
    
    alert('『您的呼息已融入荒原的風中...』\n(贈禮已發送至隨機觀測者)');
  };

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

  const handleMissionJoin = (mission: Mission) => {
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

    setIsLocked(true);
    alert('已加入主線任務。系統已鎖定您的參與權限，請前往「回報任務」頁面提交進度。');
  };

  const handleReportSubmit = () => {
    const subject = reportSubject.trim();
    const formatRegex = /^.+-.+-.+$/;
    
    if (!subject) {
      alert('請填寫回報主旨。');
      return;
    }

    if (!formatRegex.test(subject)) {
      alert('格式錯誤：請依照「章節-據點名稱-OC名稱」格式填寫。\n範例：第一章-荒原裂隙-塞理安');
      return;
    }

    const REWARD_AMOUNT = Math.floor(Math.random() * 3) + 3; // 3-5 coins
    const DAILY_LIMIT = 15;
    
    if (currentUser && currentUser.daily_coin_earned < DAILY_LIMIT) {
       const actualReward = Math.min(REWARD_AMOUNT, DAILY_LIMIT - currentUser.daily_coin_earned);
       setCurrentUser(prev => prev ? ({ 
         ...prev, 
         coins: prev.coins + actualReward,
         daily_coin_earned: prev.daily_coin_earned + actualReward
       }) : null);
       const authority = playerFaction === 'Turbid' ? '眾議會' : '教會';
       alert(`『在您不自覺成為棋子的那一刻，命運的齒輪再次轉動...』\n(回報已送出，獲得 +${actualReward} 殘幣，等待${authority}核對)`);
    } else {
       const authority = playerFaction === 'Turbid' ? '眾議會' : '教會';
       alert(`『您的行跡已被紀錄。在您不自覺成為棋子的那一刻，命運的齒輪再次轉動...』\n(今日獲取已達上限，回報已送出，等待${authority}核對)`);
    }
    
    setReportSubject('');
    setIsLocked(false);
    setHasReportedMain(true);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isDriftMode || !currentUser) return;
    
    if (currentUser.coins < 5) {
      alert('您的行囊太輕，不足以承載這段訊息的重量。');
      return;
    }

    setDriftModalOpen(true);
  };

  const handlePlaceFragment = () => {
    if (driftMessage.length === 0) {
      alert('請至少選擇一個詞彙。');
      return;
    }

    setCurrentUser(prev => prev ? ({ ...prev, coins: prev.coins - 5 }) : null);

    // Update Balance Scale
    const TILT_AMOUNT = 5 * 1.0;
    const direction = playerFaction === 'Pure' ? 1 : -1;
    setBalanceWeight(prev => Math.min(100, Math.max(0, prev + (TILT_AMOUNT * direction))));
    console.log(`[Balance] Scale tilted by ${TILT_AMOUNT * direction} units.`);

    const newFragment = {
      id: `frag-${Date.now()}`,
      x: 50 + (Math.random() * 40 - 20),
      y: 50 + (Math.random() * 40 - 20),
      content: driftMessage.join(' '),
      sender: currentUser?.oc_name || 'Unknown'
    };

    setPlacedFragments(prev => [...prev, newFragment]);
    setDriftMessage([]);
    setDriftModalOpen(false);
    setIsDriftMode(false);
    alert('殘卷已遺落在荒原之中...');
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
    items.push({ id: 'inhale', name: 'Inhale Button', x: inhalePos.x, y: inhalePos.y, type: 'ui' as const });
    items.push({ id: 'exhale', name: 'Exhale Button', x: exhalePos.x, y: exhalePos.y, type: 'ui' as const });
    items.push({ id: 'drift', name: 'Drift Toggle', x: driftTogglePos.x, y: driftTogglePos.y, type: 'ui' as const });
    items.push({ id: 'zoom', name: 'Zoom Controls', x: zoomControlsPos.x, y: zoomControlsPos.y, type: 'ui' as const });
    items.push({ id: 'fog', name: 'Fog Control', x: fogButtonPos.x, y: fogButtonPos.y, type: 'ui' as const });
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
    if (id === 'inhale') setInhalePos({ x: Number(x), y: Number(y) });
    if (id === 'exhale') setExhalePos({ x: Number(x), y: Number(y) });
    if (id === 'drift') setDriftTogglePos({ x: Number(x), y: Number(y) });
    if (id === 'zoom') setZoomControlsPos({ x: Number(x), y: Number(y) });
    if (id === 'fog') setFogButtonPos({ x: Number(x), y: Number(y) });
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
      setIsAdmin(result.user.oc_name === 'vonn');
      setShowLogin(false);
    } else {
      alert(result.message || 'Login failed');
    }
  };

  const getCurrencyIcon = () => {
    return Coins;
  };

  const getCurrencyName = () => {
    return '殘幣';
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
      className="w-full h-screen bg-black overflow-hidden relative font-sans text-gray-200"
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
          cursor: isDriftMode ? 'copy' : undefined
        }}
        onClick={handleMapClick}
      >
        {/* 1. Base Map Image (Placeholder for >4000px image) */}
        {/* Using a gradient placeholder for now, user can replace with <img> */}
        <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden">
          {/* Grid lines for reference */}
          <div className="absolute inset-0 opacity-10" 
               style={{ 
                 backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
                 backgroundSize: '100px 100px'
               }} 
          />
          
          {/* --- Turbid/Pure Zone Visuals (Baked into map usually, but simulated here) --- */}
          
          {/* Left Side (Turbid) */}
          <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-[#111] to-[#0a0a0a] opacity-50"></div>
          
          {/* Right Side (Pure) */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#0f1a0f] to-[#0a0a0a] opacity-50"></div>

          {/* Central Divide (The Scale's fulcrum area visually) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-gray-800 to-transparent"></div>
        </div>

        <FogLayer
          active={fogActive}
          dispersing={fogDispersing}
          onDisperseEnd={() => {
            setFogActive(false);
            setFogDispersing(false);
          }}
        />
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

        {/* 4. Placed Fragments (Drift Bottles) */}
        {placedFragments.map(frag => (
          <MapLandmark
            key={frag.id}
            landmark={{
              id: frag.id,
              name: '遺落殘卷',
              x: frag.x,
              y: frag.y,
              faction: 'Common',
              status: 'open',
              type: 'default'
            }}
            isDevMode={isDevMode}
            isVisible={true}
            scale={scale}
            onClick={() => handleFragmentClick(frag, null)}
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
           { icon: Settings, label: '設定', id: 'settings' },
         ].map((item) => {
           const pos = navPositions[item.id] || { x: 0, y: 0 };
           return (
             <DraggableUIButton
               key={item.id}
               id={item.id}
               pos={pos}
               isDevMode={isDevMode}
               onClick={() => !isDevMode && setActiveTab(item.id)}
               whileHover={{ x: (navPositions[item.id]?.x || 0) + 5, scale: 1.1 }}
               whileTap={{ scale: 0.95 }}
               className={`relative group flex items-center justify-center w-9 h-9 border rounded-xl transition-colors shadow-lg backdrop-blur-sm pointer-events-auto
                          ${activeTab === item.id ? 'bg-gray-700 border-white text-white' : 'bg-black/80 border-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-800'}
                          ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
             >
               <item.icon className="w-3.5 h-3.5" />
               {/* Tooltip */}
               {!isDevMode && (
                 <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-xs text-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none">
                   {item.label}
                 </span>
               )}
             </DraggableUIButton>
           );
         })}
      </div>

      {/* 2. Top Right: Currency & Profile */}
      <div className="fixed top-6 right-8 z-[100] flex items-center gap-6">
        {/* Currency Display */}
        {currentUser && (
          <div className="flex items-center gap-4 bg-black/60 px-4 py-2 rounded-full border border-gray-800 backdrop-blur-md">
            <div className="flex items-center gap-2" title={getCurrencyName()}>
              {React.createElement(getCurrencyIcon(), { className: 'w-2 h-2 text-yellow-500' })}
              <span className="text-sm font-mono text-yellow-100">
                {currentUser.coins || 0}
              </span>
            </div>
          </div>
        )}

        {/* Login/User Button */}
        <button 
          onClick={() => !currentUser && setShowLogin(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 border border-gray-600 rounded-full hover:bg-gray-800 transition-all group"
        >
          <div className={`w-2 h-2 rounded-full ${currentUser ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm tracking-wider uppercase text-gray-300 group-hover:text-white">
            {currentUser ? currentUser.oc_name : 'TERMINAL DISCONNECTED'}
          </span>
          <User className="w-3 h-3 text-gray-400" />
        </button>

        {/* Top Right Settings Icon */}
        <button 
          onClick={() => setActiveTab('settings')}
          className="p-2 bg-gray-900/80 border border-gray-600 rounded-full hover:bg-gray-800 hover:border-white transition-all text-gray-400 hover:text-white"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Developer Mode Toggle */}
        {currentUser && currentUser.oc_name === 'vonn' && (
          <button 
            onClick={() => setIsDevMode(!isDevMode)}
            className={`p-2 border rounded-full transition-all flex items-center gap-2 px-3
              ${isDevMode ? 'bg-cyan-900/40 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-gray-900/80 border-gray-600 text-gray-500 hover:text-gray-300'}`}
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
          <div className="flex flex-col items-center gap-3">
             {/* Inhale (Receive) */}
             <DraggableUIButton
               key="inhale"
               id="inhale"
               pos={inhalePos}
               isDevMode={isDevMode}
               onClick={() => !isDevMode && handleInhale()}
               disabled={!hasUnclaimedGift}
               className={`relative group w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500
                 ${hasUnclaimedGift 
                   ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-500 cursor-pointer hover:bg-yellow-900/40 hover:scale-110 shadow-[0_0_0_0px_rgba(250,204,21,0)] animate-[pulse_2s_infinite]' 
                   : 'bg-gray-900/50 border-gray-700 text-gray-600 cursor-default grayscale opacity-50'}
                 ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
             >
               <Gift className={`w-4 h-4 ${hasUnclaimedGift ? 'animate-pulse' : ''}`} />
               
               {/* Tooltip */}
               {hasUnclaimedGift && !isDevMode && (
                 <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-48 text-right opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                   <p className="text-xs text-yellow-200 font-serif tracking-widest bg-black/80 p-2 rounded border border-yellow-900/50">
                     『捕捉到一段跨越荒原的頻率。』
                   </p>
                 </div>
               )}
             </DraggableUIButton>

             {/* Exhale (Send) */}
             <DraggableUIButton
               key="exhale"
               id="exhale"
               pos={exhalePos}
               isDevMode={isDevMode}
               onClick={() => !isDevMode && setExhaleModalOpen(true)}
               className={`w-8 h-8 rounded-full border border-gray-600 bg-black/50 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center justify-center backdrop-blur-sm
                 ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
               title="呼出贈禮"
             >
               <Feather className="w-3 h-3 transform rotate-180" />
             </DraggableUIButton>
          </div>

          <DraggableUIButton
            key="drift"
            id="drift"
            pos={driftTogglePos}
            isDevMode={isDevMode}
            onClick={() => !isDevMode && setIsDriftMode(!isDriftMode)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-lg backdrop-blur-sm mx-auto
              ${isDriftMode ? 'bg-white text-black border-white' : 'bg-gray-900/80 text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800'}
              ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
            title="荒原拾遺"
          >
            <Feather className="w-3.5 h-3.5" />
          </DraggableUIButton>

          <DraggableUIButton
            key="fog"
            id="fog"
            pos={fogButtonPos}
            isDevMode={isDevMode}
            onClick={() => {
              if (!isDevMode) {
                setFogDispersing(true);
              }
            }}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-lg backdrop-blur-sm mx-auto
              ${fogActive ? 'bg-gray-900/80 text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800' : 'bg-gray-800/60 text-gray-600 border-gray-700'}
              ${isDevMode ? 'ring-1 ring-cyan-500/50 z-[100]' : ''}`}
            title="驅散迷霧"
          >
            <Cloud className="w-3.5 h-3.5" />
          </DraggableUIButton>

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
      <AnimatePresence>
        {exhaleModalOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setExhaleModalOpen(false)}
          >
            <div className="w-[450px] bg-[#1a1a1a] border border-gray-700 p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-serif text-gray-200 mb-6 text-center tracking-widest italic">BREATHING: EXHALE</h3>
              
              <div className="space-y-4 mb-8">
                <p className="text-xs text-gray-500 text-center font-mono mb-4">選擇一份微薄的贈禮，讓它隨風而去...</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {BREATHING_ITEMS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedExhaleItem(item.id)}
                      className={`p-3 border text-xs text-left transition-all flex justify-between items-center
                        ${selectedExhaleItem === item.id 
                          ? 'border-yellow-500 bg-yellow-900/20 text-yellow-100' 
                          : 'border-gray-800 bg-black/50 text-gray-400 hover:border-gray-600'}`}
                    >
                      <span>{item.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">-{item.cost} G</span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={exhaleMessage}
                  onChange={(e) => setExhaleMessage(e.target.value)}
                  placeholder="附上一句低語 (選填)..."
                  className="w-full bg-black border border-gray-700 p-3 text-gray-300 text-xs font-serif mt-4 h-20 resize-none focus:border-gray-500 transition-colors"
                />
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleExhale}
                  disabled={!selectedExhaleItem}
                  className={`px-8 py-2 text-xs font-bold tracking-widest uppercase transition-colors border
                    ${selectedExhaleItem 
                      ? 'bg-white text-black border-white hover:bg-gray-200' 
                      : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'}`}
                >
                  呼出 (Send)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Modals System */}
      <AnimatePresence>
        {activeTab && activeTab !== 'none' && (
          <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-start pl-20" style={{ pointerEvents: 'auto' }}>
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="w-[450px] bg-black/95 border border-gray-800 backdrop-blur-md flex flex-col p-6 shadow-2xl h-[calc(100vh-160px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-xl tracking-[0.2em] text-gray-300 font-serif italic">
                {activeTab === 'announcement' && '觀測日誌'}
                {activeTab === 'quest' && '任務徵集'}
                {activeTab === 'daily' && '靈魂足跡'}
                {activeTab === 'collection' && '萬象圖鑑'}
                {activeTab === 'inventory' && '混沌背包'}
                {activeTab === 'settings' && '儀式設定'}
              </h3>
              <button onClick={() => setActiveTab(null)} className="text-gray-500 hover:text-white transition-colors">
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
                        <h4 className="text-sm font-bold text-gray-300 tracking-wider group-hover:text-white transition-colors">{a.title}</h4>
                        <span className="text-[10px] text-gray-600 font-mono">{a.date}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-loose font-serif border-l-2 border-gray-800 pl-4 group-hover:border-gray-500 transition-colors">
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
                  <div className="flex border-b border-gray-800 mb-6">
                    <button
                      onClick={() => setQuestTab('recruitment')}
                      className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors
                        ${questTab === 'recruitment' ? 'text-white border-b border-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      現有任務
                    </button>
                    <button
                      onClick={() => setQuestTab('reporting')}
                      className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors
                        ${questTab === 'reporting' ? 'text-white border-b border-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      回報任務
                    </button>
                  </div>

                  {questTab === 'recruitment' && (
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                      {missions
                        .filter(m => m.faction === 'Common' || m.faction === playerFaction)
                        .map(m => (
                        <div key={m.id} className={`p-4 border ${m.status === 'full' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-700 bg-black'} transition-all`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`text-md font-serif ${m.status === 'full' ? 'text-gray-600' : 'text-gray-200'}`}>{m.title}</h4>
                            <span className={`text-xs px-2 py-1 border ${m.faction === 'Turbid' ? 'border-purple-900 text-purple-400' : m.faction === 'Pure' ? 'border-green-900 text-green-400' : 'border-gray-800 text-gray-500'}`}>
                              {m.faction}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-4 font-light leading-relaxed">{m.description}</p>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono text-gray-600">
                              {m.type === 'main' ? (
                                <>人員: <span className={m.status === 'full' ? 'text-red-900' : 'text-white'}>({m.current}/{m.max})</span></>
                              ) : (
                                <>匯聚人數: <span className="text-white">{m.current} / ∞</span></>
                              )}
                            </span>
                            <button 
                              onClick={() => handleMissionJoin(m)}
                              disabled={m.type === 'main' && (m.status === 'full' || hasReportedMain)}
                              className={`px-4 py-1 text-xs tracking-widest uppercase transition-colors
                                ${m.type === 'main' && m.status === 'full' 
                                  ? 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800' 
                                  : m.type === 'main' && hasReportedMain
                                    ? 'bg-gray-800 text-green-500 cursor-not-allowed border border-green-900'
                                    : m.type === 'main' && isLocked
                                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                      : 'bg-white text-black hover:bg-gray-200'}`}
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
                      <div className="p-4 bg-gray-900/30 border border-gray-800">
                        <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">Mission Subject</label>
                        <input 
                          type="text" 
                          value={reportSubject}
                          onChange={(e) => setReportSubject(e.target.value)}
                          placeholder="[章節]-[據點名稱]-[OC名稱]" 
                          className="w-full bg-black border border-gray-700 p-3 text-gray-300 focus:outline-none focus:border-white transition-colors text-sm font-mono mb-4" 
                        />
                        <p className="text-[10px] text-gray-600 mb-6 font-mono">
                          * 格式範例：第一章-荒原裂隙-塞理安<br/>
                          * 請確認據點名稱與當前位置一致。
                        </p>
                        <button 
                          onClick={handleReportSubmit}
                          className="w-full py-2 bg-white text-black text-xs font-bold tracking-widest hover:bg-gray-200 transition-colors uppercase"
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
                  <div className="flex border-b border-gray-800 mb-6">
                    <button
                      onClick={() => setDailyTab('echoes')}
                      className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors
                        ${dailyTab === 'echoes' ? 'text-white border-b border-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      靈魂足跡
                    </button>
                    <button
                      onClick={() => setDailyTab('snippets')}
                      className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors
                        ${dailyTab === 'snippets' ? 'text-white border-b border-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      觀察日報
                    </button>
                  </div>

                  {dailyTab === 'echoes' && (
                    <div className="space-y-6 relative flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gray-700 via-gray-900 to-transparent"></div>
                      {echoLogs
                        .filter(log => log.faction === playerFaction)
                        .map((log, index) => (
                        <div key={log.id} 
                            className="pl-6 relative"
                            style={{ opacity: Math.max(0.3, 1 - index * 0.15) }} // Time Fading Effect
                        >
                          <div className="absolute left-0 top-1.5 w-2 h-2 bg-gray-800 rounded-full border border-gray-600 -translate-x-[3px]"></div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono text-gray-500">{log.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-400 font-serif leading-relaxed">
                            {log.content}
                          </p>
                        </div>
                      ))}
                      {echoLogs.filter(log => log.faction === playerFaction).length === 0 && (
                        <p className="text-center text-gray-700 italic mt-10">尚無任何足跡...</p>
                      )}
                    </div>
                  )}

                  {dailyTab === 'snippets' && (
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {dailySnippets.map((snippet) => (
                        <div key={snippet.id} className="p-4 bg-gray-900/50 border border-gray-800 rounded relative group hover:border-gray-700 transition-colors">
                          <p className="text-sm text-gray-300 font-serif mb-3 leading-relaxed">
                            {snippet.content}
                          </p>
                          <div className="flex justify-end items-center">
                            <button 
                              onClick={() => handleLikeSnippet(snippet.id)}
                              className={`flex items-center gap-1.5 text-xs transition-colors ${snippet.isLiked ? 'text-red-400' : 'text-gray-600 hover:text-red-300'}`}
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
                  <div className="flex border-b border-gray-800 mb-6">
                    {(['raiment', 'fragments', 'relics'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setCollectionTab(tab)}
                        className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors
                          ${collectionTab === tab ? 'text-white border-b border-white' : 'text-gray-600 hover:text-gray-400'}`}
                      >
                        {tab === 'raiment' ? '衣服' : tab === 'fragments' ? '碎片' : '遺物'}
                      </button>
                    ))}
                  </div>
                  
                  {collectionTab === 'raiment' && (
                    <div className="mb-6 p-6 bg-gray-900/30 border border-gray-800 rounded text-center">
                       <p className="text-xs text-gray-500 font-serif mb-4 italic leading-relaxed">
                         『命運的輪盤已不再此處轉動...<br/>
                         舊日的衣裝已悉數移往據點商店。』
                       </p>
                       <div className="flex items-center justify-center gap-2 text-[10px] text-cyan-700 font-mono uppercase tracking-[0.2em]">
                         <Settings className="w-3 h-3 animate-spin-slow" />
                         Transferred to Landmark Shop
                       </div>
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-2 gap-4 content-start overflow-y-auto pr-2 custom-scrollbar">
                     {/* Placeholder Content */}
                     {[1, 2, 3, 4].map(i => (
                       <div key={i} className="aspect-square bg-gray-900/50 border border-gray-800 flex flex-col items-center justify-center gap-2 group hover:border-gray-600 transition-colors cursor-pointer">
                          {collectionTab === 'raiment' && <Shirt className="w-6 h-6 text-gray-700 group-hover:text-gray-500" />}
                          {collectionTab === 'fragments' && <Puzzle className="w-6 h-6 text-gray-700 group-hover:text-gray-500" />}
                          {collectionTab === 'relics' && <Hourglass className="w-6 h-6 text-gray-700 group-hover:text-gray-500" />}
                          <span className="text-[10px] text-gray-600 uppercase">Unknown #{i}</span>
                       </div>
                     ))}
                  </div>
                  
                  <p className="mt-6 text-[10px] text-gray-700 text-center border-t border-gray-900 pt-4">
                    * 圖片僅留存於 QQ 群聊相本，此處僅供感官回溯。
                  </p>
                </div>
              )}

              {/* --- 背包 (Inventory) --- */}
              {activeTab === 'inventory' && (
                <div className="h-full flex flex-col">
                  {/* Currency Header */}
                  <div className="flex gap-4 mb-6 p-4 bg-gray-900/30 rounded border border-gray-800">
                    <div className="flex-1 flex items-center gap-2">
                       <Coins className="w-3 h-3 text-yellow-500" />
                       <div>
                         <div className="text-[10px] text-gray-500 uppercase">殘幣</div>
                         <div className="text-lg font-mono text-gray-200">{currentUser?.coins || 0}</div>
                       </div>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <div className="text-xs text-gray-500 uppercase">
                        Capacity: <span className={currentUser?.inventory && currentUser.inventory.length >= MAX_INVENTORY_SIZE ? 'text-red-500' : 'text-gray-300'}>
                          {currentUser?.inventory?.length || 0}/{MAX_INVENTORY_SIZE}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid or Empty State */}
                  {currentUser?.inventory && currentUser.inventory.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                       {currentUser.inventory.map((item, i) => (
                         <div key={i} className="aspect-square bg-gray-900 border border-gray-800 flex items-center justify-center relative group">
                           {/* Item Placeholder */}
                           <div className="w-8 h-8 bg-gray-700 rounded-full opacity-50"></div>
                           <span className="absolute bottom-1 right-1 text-[8px] text-gray-500">x1</span>
                         </div>
                       ))}
                       {/* Fill remaining slots with empty boxes */}
                       {Array.from({ length: Math.max(0, MAX_INVENTORY_SIZE - (currentUser.inventory.length)) }).map((_, i) => (
                         <div key={`empty-${i}`} className="aspect-square bg-black/30 border border-gray-900"></div>
                       ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                       <div className="w-16 h-16 border border-gray-800 rounded-full flex items-center justify-center mb-4">
                         <span className="text-2xl">💨</span>
                       </div>
                       <p className="text-sm text-gray-500 font-serif italic">
                         「行囊空空如也，<br/>唯有風聲在其中迴盪。」
                       </p>
                    </div>
                  )}
                </div>
              )}

              {/* --- 設定 (Settings) --- */}
              {activeTab === 'settings' && (
                <div className="space-y-8 py-4">
                   {/* BGM Volume */}
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Music className="w-3 h-3" /> BGM Volume</span>
                        <span className="font-mono">{bgmVolume}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={bgmVolume}
                        onChange={(e) => setBgmVolume(Number(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                   </div>

                   {/* SFX Volume */}
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Volume2 className="w-3 h-3" /> SFX Volume</span>
                        <span className="font-mono">{sfxVolume}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={sfxVolume}
                        onChange={(e) => setSfxVolume(Number(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                   </div>

                   <div className="pt-4 border-t border-gray-800 space-y-4">
                     <p className="text-[10px] text-gray-600 text-center font-mono">
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
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setDriftModalOpen(false)}
          >
            <div className="w-[500px] bg-black border border-gray-700 p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-serif text-gray-200 mb-6 text-center tracking-widest">刻寫殘卷</h3>
              
              <div className="min-h-[100px] border border-gray-800 bg-gray-900/50 p-4 mb-6 flex flex-wrap gap-2 items-start content-start">
                {driftMessage.length > 0 ? (
                  driftMessage.map((word, idx) => (
                    <span key={idx} className="bg-white text-black px-2 py-1 text-sm font-mono">{word}</span>
                  ))
                ) : (
                  <span className="text-gray-600 text-sm italic">請從下方選擇詞彙拼湊訊息...</span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-8">
                {wordBank.map(word => (
                  <button
                    key={word}
                    onClick={() => handleWordSelect(word)}
                    disabled={driftMessage.length >= 5}
                    className="py-2 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-900 transition-colors text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {word}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-gray-800 pt-6">
                <button 
                  onClick={() => setDriftMessage([])}
                  className="text-gray-500 text-xs hover:text-white transition-colors"
                >
                  清除重寫
                </button>
                <div className="flex gap-4">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    消耗: <span className={currentUser && currentUser.coins >= 5 ? 'text-yellow-500' : 'text-red-500'}>5</span> <Coins className="w-2 h-2 text-yellow-500" />
                  </span>
                  <button 
                    onClick={handlePlaceFragment}
                    disabled={!currentUser || currentUser.coins < 5}
                    className={`px-6 py-2 text-xs font-bold tracking-widest transition-colors
                      ${!currentUser || currentUser.coins < 5 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-gray-200'}`}
                  >
                    遺落此處
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Drift Bottle Viewer Modal */}
      <AnimatePresence>
        {selectedFragment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedFragment(null)}
          >
            <div className="w-[400px] bg-[#1a1a1a] border border-gray-600 p-8 shadow-2xl relative text-center" onClick={e => e.stopPropagation()}>
              <Feather className="w-6 h-6 text-gray-400 mx-auto mb-6" />
              
              <div className="space-y-4 mb-8">
                <p className="text-2xl font-serif text-gray-200 leading-relaxed tracking-widest">
                  「{selectedFragment.content}」
                </p>
                <div className="w-8 h-[1px] bg-gray-600 mx-auto"></div>
                <p className="text-xs text-gray-500 font-mono uppercase">
                  FROM: {selectedFragment.sender}
                </p>
              </div>

              <button 
                onClick={() => alert('請前往 QQ 群聊尋找此人。')}
                className="w-full py-3 border border-gray-700 text-gray-400 text-xs tracking-widest hover:text-white hover:border-gray-500 transition-colors uppercase"
              >
                前往 QQ 群聊尋找此人
              </button>
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
      {currentUser && currentUser.oc_name === 'vonn' && (
        <AdminApostateControl 
          currentUser={currentUser}
          onUpdate={() => {
            // Optional: Refresh logic if needed
          }}
        />
      )}

    </div>
  );
};
