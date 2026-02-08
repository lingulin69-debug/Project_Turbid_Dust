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
  Heart
} from 'lucide-react';
import { ApostateSystem, ApostateGeometryIcon } from './ApostateSystem';
import { AdminApostateControl } from './AdminApostateControl';
import { LiquidatorSystem, LiquidatorLensIcon } from './LiquidatorSystem';

interface Landmark {
  id: string;
  name: string;
  x: string;
  y: string;
  faction: 'Turbid' | 'Pure' | 'Common';
  status: 'open' | 'closed';
  occupants: number;
  capacity: number;
}

const landmarks: Landmark[] = [
  { id: 'l1', name: '空衣街區', x: '20%', y: '40%', faction: 'Turbid', status: 'open', occupants: 2, capacity: 5 },
  { id: 'l2', name: '舊觀測站', x: '45%', y: '30%', faction: 'Turbid', status: 'closed', occupants: 0, capacity: 3 },
  { id: 'l3', name: '淨化尖塔', x: '75%', y: '50%', faction: 'Pure', status: 'open', occupants: 5, capacity: 10 },
  { id: 'l4', name: '中央圖書館', x: '60%', y: '65%', faction: 'Pure', status: 'open', occupants: 1, capacity: 8 },
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

  // Gacha System State
  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [isGachaAnimating, setIsGachaAnimating] = useState(false);
  const [gachaResultOpen, setGachaResultOpen] = useState(false);
  const [gachaResult, setGachaResult] = useState<{ message: string, item: any } | null>(null);
  const [gachaTiltTriggered, setGachaTiltTriggered] = useState(false);
  
  // Apostate System State
  const [apostateMenuOpen, setApostateMenuOpen] = useState(false);
  const [liquidatorMenuOpen, setLiquidatorMenuOpen] = useState(false);
  
  // 2. 天平核心計演算法 (Tilt Algorithm)
  // 0 = Balanced, >0 = Order (Pure), <0 = Chaos (Turbid)
  const [balanceWeight, setBalanceWeight] = useState(0);
  
  // Gacha Items Pool (Mock Data - In real app, fetch from blind_box_items)
  const GACHA_POOL = [
    { id: 'c1', name: '霧行者風衣', type: 'raiment', rarity: 'rare', dropRate: 0.1 },
    { id: 'c2', name: '舊日學徒制服', type: 'raiment', rarity: 'common', dropRate: 0.3 },
    { id: 'c3', name: '觀測員斗篷', type: 'raiment', rarity: 'legendary', dropRate: 0.05 },
    // Fillers
    { id: 'f1', name: '記憶碎片', type: 'fragment', rarity: 'common', dropRate: 0.55 },
  ];

  const handleGachaDraw = () => {
    if (!currentUser) return;
    const COST = 8;

    if (currentUser.coins < COST) {
      alert('您的行囊太輕，無法轉動命運的齒輪。');
      return;
    }

    // 1. Deduct Cost
    setCurrentUser(prev => prev ? ({ ...prev, coins: prev.coins - COST }) : null);
    
    // 2. Start Animation
    setIsGachaAnimating(true);
    // Play sound effect here (mock)
    console.log('[Audio] Playing: Wood Creak & Bell Chime');

    // 3. Calculate Result (after delay)
    setTimeout(() => {
      const rand = Math.random();
      let cumulative = 0;
      let result = GACHA_POOL[GACHA_POOL.length - 1]; // Default fallback

      for (const item of GACHA_POOL) {
        cumulative += item.dropRate;
        if (rand <= cumulative) {
          result = item;
          break;
        }
      }

      // 4. Handle Result Logic
      let message = '';
      let newState = { ...currentUser };
      
      if (result.type === 'raiment') {
        if (currentUser.wardrobe.includes(result.id)) {
          // Duplicate -> Convert to Shards
          newState.collected_shards = (newState.collected_shards || 0) + 2;
          message = `抽中已擁有的【${result.name}】，已轉化為 2 個碎片。`;
        } else {
          // New Item
          newState.wardrobe = [...newState.wardrobe, result.id];
          message = `獲得新衣裝：【${result.name}】`;
        }
      } else {
        // Fragment
        newState.collected_shards = (newState.collected_shards || 0) + 1;
        message = `獲得：【${result.name}】 x1`;
      }

      // Update State
      setCurrentUser(prev => prev ? ({ ...prev, ...newState }) : null);
      setIsGachaAnimating(false);
      
      // 5. Balance Scale Tilt
      // 30% chance to trigger scale tilt
      const shouldTilt = Math.random() < 0.3;
      setGachaTiltTriggered(shouldTilt);
      
      if (shouldTilt) {
        const tiltDirection = Math.random() > 0.5 ? 'Order' : 'Chaos';
        const tiltValue = tiltDirection === 'Order' ? 0.5 : -0.5;
        setBalanceWeight(prev => prev + tiltValue);
        console.log(`[Balance] Scale tilted by ${tiltValue} units towards ${tiltDirection}.`);
      }
      
      setGachaResult({ message, item: result });
      setGachaResultOpen(true);

    }, 2000); // 2s Animation Duration
  };

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
       // Mock check logic: In real app, check `breath_pool` table
       // For demo, we assume there's always a gift if not claimed in this session
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
    const TILT_AMOUNT = item.cost * 5.0;
    const direction = playerFaction === 'Pure' ? 1 : -1;
    setBalanceWeight(prev => prev + (TILT_AMOUNT * direction));
    
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
    // 1. 樂觀更新 UI (Optimistic Update)
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

    // 2. 真實資料庫同步 (Real DB Sync)
    // 這裡模擬資料庫操作，實際應調用 supabase.from('daily_snippets').update(...)
    console.log(`[DB Sync] Updated likes for snippet ${id}`);
  };

  const handleMissionJoin = (mission: Mission) => {
    // 1. 常駐/支線任務 (Side Quests) - 永遠開放
    if (mission.type === 'side') {
      alert(`已加入支線任務：${mission.title}。請前往現場進行支援。`);
      return;
    }

    // 2. 主線任務 (Main Story) - 受鎖定機制限制
    if (hasReportedMain) {
      alert('本章節的主線回報已記錄。命運的齒輪暫時靜止，請等待下一次版本更新。');
      return;
    }

    if (isLocked) {
      alert('命運的齒輪已卡死，在下一次雨落前，您無法再承擔新的宿命。\n(請先完成並回報當前進行中的任務)');
      return;
    }

    // 鎖定玩家
    setIsLocked(true);
    alert('已加入主線任務。系統已鎖定您的參與權限，請前往「回報任務」頁面提交進度。');
  };

  const handleReportSubmit = () => {
    const subject = reportSubject.trim();
    
    // 1. 格式驗證 (Format Validation)
    // Regex: 任意字符-任意字符-任意字符 (簡單驗證連字符存在)
    const formatRegex = /^.+-.+-.+$/;
    
    if (!subject) {
      alert('請填寫回報主旨。');
      return;
    }

    if (!formatRegex.test(subject)) {
      alert('格式錯誤：請依照「章節-據點名稱-OC名稱」格式填寫。\n範例：第一章-荒原裂隙-塞理安');
      return;
    }

    // 2. 模擬送出回報 (Simulate Submission)
    // 在真實環境中，這裡會寫入 participation_records 表
    
    // Reward Logic (Daily Limit Check)
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
    setIsLocked(false); // 解除報名鎖定
    setHasReportedMain(true); // 標記為已回報主線 (單次鎖定)
  };

  
  const handleMapClick = (e: React.MouseEvent) => {
    if (!isDriftMode || !currentUser) return;
    
    // Check cost
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

    // Deduct cost (Optimistic)
    setCurrentUser(prev => prev ? ({ ...prev, coins: prev.coins - 5 }) : null);

    // Update Balance Scale (Chaos vs Order)
    // Formula: Tilt_Offset = Amount * 5.0 (Amplified for small amounts)
    const TILT_AMOUNT = 5 * 5.0;
    const direction = playerFaction === 'Pure' ? 1 : -1; // Pure adds Order (+), Turbid adds Chaos (-)
    setBalanceWeight(prev => prev + (TILT_AMOUNT * direction));
    console.log(`[Balance] Scale tilted by ${TILT_AMOUNT * direction} units.`);

    // Place fragment at random nearby location (Simulated)
    const newFragment = {
      id: `frag-${Date.now()}`,
      x: 50 + (Math.random() * 40 - 20), // Center-ish random
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

  const handleFragmentClick = (frag: {id: string, content: string, sender: string}, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFragment(frag);
  };

  const handleWordSelect = (word: string) => {
    if (driftMessage.length >= 5) return; // Max 5 words
    setDriftMessage(prev => [...prev, word]);
  };

  // Login Inputs
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  
  // Map Interaction State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Use Gesture for Drag & Pinch (Zoom)
  const bind = useGesture({
    onDrag: ({ offset: [dx, dy] }) => {
      setPosition({ x: dx, y: dy });
    },
    onPinch: ({ offset: [d] }) => {
      setScale(1 + d / 200);
    },
    onWheel: ({ delta: [, dy] }) => {
      setScale(s => Math.min(Math.max(0.5, s - dy * 0.001), 3));
    }
  }, {
    drag: { from: () => [position.x, position.y] },
    pinch: { scaleBounds: { min: 0.5, max: 3 }, rubberband: true },
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

  // 判斷是否可見 (Fog of War Logic) - Optimized with useCallback
  const isVisible = React.useCallback((targetFaction: string) => {
    if (isAdmin) return true;
    if (targetFaction === 'Common') return true;
    // Common 玩家邏輯：顯示模糊輪廓但不顯示詳細資訊
    if (playerFaction === 'Common') return false; 
    return playerFaction === targetFaction;
  }, [isAdmin, playerFaction]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans text-gray-200">
      
      {/* --- Map Container (Draggable & Zoomable) --- */}
      <div 
        ref={mapRef}
        {...bind()}
        className={`w-full h-full cursor-grab active:cursor-grabbing touch-none absolute top-0 left-0 will-change-transform origin-center transition-[filter] duration-1000 ${!currentUser ? 'blur-[20px] pointer-events-none grayscale' : ''}`}
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: isDriftMode ? 'copy' : undefined
        }}
        onClick={handleMapClick}
      >
        <div className="w-[1920px] h-[1080px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex shadow-2xl">
          
          {/* --- 左側：濁息陣營 (Turbid) --- */}
          <div className="w-1/2 h-full relative overflow-hidden transition-all duration-1000"
               style={{ backgroundColor: '#1a1a1a' }}>
            
            {/* 靜態雜訊背景 - Optimized: reduce opacity or use CSS only noise if possible */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>
            {/* 動態黑霧層 - Optimized: simple gradient pulse */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/60 animate-pulse pointer-events-none duration-[3000ms]"></div>

            {/* 陣營標題 */}
            <div className="absolute top-20 left-20 z-10 pointer-events-none">
              <h2 className="text-5xl font-bold text-gray-500 tracking-[0.2em] mb-4 opacity-30 select-none">TURBID</h2>
              <p className="text-lg text-gray-400 italic max-w-md leading-relaxed border-l-2 border-gray-700 pl-4">
                「此處已被濁息侵蝕，<br/>
                眾議會 (The Council) 的低語在霧中迴盪...<br/>
                迷途者，切勿回頭。」
              </p>
            </div>

            {/* 據點渲染 */}
            {landmarks.filter(l => l.faction === 'Turbid').map(landmark => (
              <div key={landmark.id}
                   className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-transform
                              ${landmark.status === 'open' ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50 grayscale pointer-events-none'}`}
                   style={{ left: landmark.x, top: landmark.y }}>
                 
                 <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 relative flex items-center justify-center
                                ${isVisible('Turbid') ? 'bg-gray-800 border-gray-400 shadow-[0_0_20px_rgba(200,200,200,0.3)]' : 'bg-black border-gray-800 opacity-20'}`}>
                    {isVisible('Turbid') && landmark.status === 'open' && <div className="w-3 h-3 bg-gray-200 rounded-full animate-ping absolute"></div>}
                    {isVisible('Turbid') && <div className="w-3 h-3 bg-gray-200 rounded-full absolute"></div>}
                 </div>

                 {isVisible('Turbid') && (
                   <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-base whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 tracking-widest bg-black/80 px-3 py-1 rounded backdrop-blur-sm border border-gray-700 flex flex-col items-center gap-1 z-50 pointer-events-none">
                     <span className="text-gray-300">{landmark.name}</span>
                     <span className={`text-[10px] font-mono ${landmark.status === 'open' ? 'text-green-400' : 'text-gray-500'}`}>
                       {landmark.status === 'open' ? `(參與: ${landmark.occupants}/${landmark.capacity})` : '【封鎖區域】'}
                     </span>
                   </div>
                 )}
              </div>
            ))}

            {/* 黑霧遮罩 */}
            {!isVisible('Turbid') && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                 <div className="absolute inset-0 bg-black opacity-90 mix-blend-multiply"></div>
                 <div className="w-[200%] h-[200%] absolute bg-gradient-to-tr from-transparent via-gray-900 to-transparent opacity-30 animate-spin-slow" style={{ animationDuration: '60s' }}></div>
                 <p className="relative z-30 text-gray-500 tracking-[0.5em] text-2xl font-light border-y border-gray-800 py-4 bg-black/60 backdrop-blur-md">
                   [ 禁忌之地 · 視線隔絕 ]
                 </p>
              </div>
            )}
          </div>

          {/* --- 分隔線 --- */}
          <div className="w-[6px] h-full bg-black z-30 relative shrink-0 shadow-[0_0_30px_black]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-600 to-transparent opacity-30"></div>
          </div>

          {/* --- 右側：淨塵陣營 (Pure) --- */}
          <div className="w-1/2 h-full relative overflow-hidden transition-all duration-1000"
               style={{ backgroundColor: '#1b2e1b' }}>
            
            {/* 靜態光斑背景 - Optimized */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(74,222,128,0.2),_transparent_60%)]"></div>
            
            {/* 陣營標題 */}
            <div className="absolute top-20 right-20 z-10 text-right pointer-events-none">
              <h2 className="text-5xl font-bold text-green-800 tracking-[0.2em] mb-4 opacity-30 select-none">PURE</h2>
              <p className="text-lg text-green-400 italic max-w-md ml-auto leading-relaxed border-r-2 border-green-800 pr-4">
                「秩序於混沌中新生，<br/>
                教會 (The Church) 的鐘聲將指引方向。<br/>
                守望者，請保持清醒。」
              </p>
            </div>

            {/* 據點渲染 */}
            {landmarks.filter(l => l.faction === 'Pure').map(landmark => (
              <div key={landmark.id}
                   className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-transform
                              ${landmark.status === 'open' ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50 grayscale pointer-events-none'}`}
                   style={{ left: landmark.x, top: landmark.y }}>
                 
                 <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 relative flex items-center justify-center
                                ${isVisible('Pure') ? 'bg-[#0f2a0f] border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'bg-[#051005] border-green-900 opacity-20'}`}>
                    {isVisible('Pure') && landmark.status === 'open' && <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse absolute"></div>}
                 </div>

                 {isVisible('Pure') && (
                   <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-base whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 tracking-widest bg-[#051005]/80 px-3 py-1 rounded backdrop-blur-sm border border-green-800 flex flex-col items-center gap-1 z-50 pointer-events-none">
                     <span className="text-green-300">{landmark.name}</span>
                     <span className={`text-[10px] font-mono ${landmark.status === 'open' ? 'text-green-400' : 'text-gray-500'}`}>
                       {landmark.status === 'open' ? `(參與: ${landmark.occupants}/${landmark.capacity})` : '【封鎖區域】'}
                     </span>
                   </div>
                 )}
              </div>
            ))}

            {/* 黑霧遮罩 */}
            {!isVisible('Pure') && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                 <div className="absolute inset-0 bg-[#020502] opacity-90 mix-blend-multiply"></div>
                 <div className="w-[200%] h-[200%] absolute bg-gradient-to-bl from-transparent via-[#0a1a0a] to-transparent opacity-40 animate-pulse duration-[3000ms]"></div>
                 <p className="relative z-30 text-green-800 tracking-[0.5em] text-2xl font-light border-y border-green-900 py-4 bg-[#051005]/60 backdrop-blur-md">
                   [ 權限不足 · 淨土隱匿 ]
                 </p>
              </div>
            )}
            {/* 放置的殘卷 (Placed Fragments) */}
            {placedFragments.map(frag => (
              <div 
                key={frag.id}
                className="absolute z-40 cursor-pointer hover:scale-110 transition-transform group"
                style={{ left: `${frag.x}%`, top: `${frag.y}%` }}
                onClick={(e) => handleFragmentClick(frag, e)}
              >
                <Feather className="w-6 h-6 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-bounce" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 text-[10px] text-gray-300 rounded border border-gray-700 pointer-events-none">
                  拾取殘卷
                </div>
              </div>
            ))}

          </div>

        </div>
      </div>

      {/* --- HUD Layer (Fixed UI) --- */}
      
      {/* 1. Left Sidebar Navigation */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-3 p-3">
         {[
           { icon: Bell, label: '公告', id: 'announcement' },
           { icon: ScrollText, label: '任務', id: 'quest' },
           { icon: CalendarDays, label: '日誌', id: 'daily' },
           { icon: BookOpen, label: '圖鑑', id: 'collection' },
           { icon: Backpack, label: '背包', id: 'inventory' },
           { icon: Settings, label: '設定', id: 'settings' },
         ].map((item) => (
           <motion.button 
             key={item.id}
             onClick={() => setActiveTab(item.id)}
             whileHover={{ x: 5, scale: 1.1 }}
             whileTap={{ scale: 0.95 }}
             className={`relative group flex items-center justify-center w-9 h-9 border rounded-xl transition-colors shadow-lg backdrop-blur-sm
                        ${activeTab === item.id ? 'bg-gray-700 border-white text-white' : 'bg-black/80 border-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-800'}`}
           >
             <item.icon className="w-3.5 h-3.5" />
             {/* Tooltip */}
             <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-xs text-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none">
               {item.label}
             </span>
           </motion.button>
         ))}
      </div>

      {/* 2. Top Right: Currency & Profile */}
      <div className="fixed top-6 right-8 z-50 flex items-center gap-6">
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
      </div>

      {/* Right Toolbar Container */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-8 pointer-events-none">
        
        {/* Upper Tools Group */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Breathing Icon (Gift System) */}
          <div className="flex flex-col items-center gap-3">
             {/* Inhale (Receive) */}
             <motion.button
               onClick={handleInhale}
               disabled={!hasUnclaimedGift}
               animate={hasUnclaimedGift ? { 
                 boxShadow: [
                   "0 0 0 0px rgba(250, 204, 21, 0)",
                   "0 0 0 10px rgba(250, 204, 21, 0.1)",
                   "0 0 0 20px rgba(250, 204, 21, 0)"
                 ],
                 transition: { duration: 2, repeat: Infinity }
               } : {}}
               className={`relative group w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500
                 ${hasUnclaimedGift 
                   ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-500 cursor-pointer hover:bg-yellow-900/40 hover:scale-110' 
                   : 'bg-gray-900/50 border-gray-700 text-gray-600 cursor-default grayscale opacity-50'}`}
             >
               <Gift className={`w-4 h-4 ${hasUnclaimedGift ? 'animate-pulse' : ''}`} />
               
               {/* Tooltip */}
               {hasUnclaimedGift && (
                 <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-48 text-right opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                   <p className="text-xs text-yellow-200 font-serif tracking-widest bg-black/80 p-2 rounded border border-yellow-900/50">
                     『捕捉到一段跨越荒原的頻率。』
                   </p>
                 </div>
               )}
             </motion.button>

             {/* Exhale (Send) */}
             <button
               onClick={() => setExhaleModalOpen(true)}
               className="w-8 h-8 rounded-full border border-gray-600 bg-black/50 text-gray-400 hover:text-white hover:border-white transition-colors flex items-center justify-center backdrop-blur-sm"
               title="呼出贈禮"
             >
               <Feather className="w-3 h-3 transform rotate-180" />
             </button>
          </div>

          {/* Drift Bottle Mode Toggle */}
          <button
            onClick={() => setIsDriftMode(!isDriftMode)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-lg backdrop-blur-sm mx-auto
              ${isDriftMode ? 'bg-white text-black border-white' : 'bg-gray-900/80 text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800'}`}
            title="荒原拾遺"
          >
            <Feather className="w-3.5 h-3.5" />
          </button>

          {/* Apostate Icon (Only if role is apostate) */}
           {currentUser && currentUser.identity_role === 'apostate' && (
              <ApostateGeometryIcon 
                onClick={() => setApostateMenuOpen(true)} 
                isAvailable={true} 
              />
           )}

           {/* Liquidator Icon (Only if role is liquidator) */}
           {currentUser && currentUser.identity_role === 'liquidator' && (
              <LiquidatorLensIcon 
                onClick={() => setLiquidatorMenuOpen(true)} 
                isAvailable={true} 
              />
           )}
        </div>

        {/* Zoom Controls Group */}
        <div className="flex flex-col bg-gray-900/80 border border-gray-600 rounded-lg overflow-hidden backdrop-blur-sm pointer-events-auto shadow-lg">
          <button
            onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
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
        </div>

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

      {/* 10. Gacha Result Modal */}
      <AnimatePresence>
        {gachaResultOpen && gachaResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={() => setGachaResultOpen(false)}
          >
            <div className="w-[500px] bg-[#0a0a0a] border border-[#3a3a3a] p-10 shadow-2xl relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
              {/* Grainy Texture Overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>
              
              <h3 className="text-2xl font-serif text-[#e5e5e5] mb-2 tracking-[0.3em] italic">舊日衣櫃的殘響</h3>
              <div className="w-16 h-[1px] bg-gray-600 mx-auto mb-8"></div>
              
              {/* Item Display */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                 <div className="w-24 h-24 mx-auto bg-gray-900 border border-gray-700 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                   {gachaResult.item.type === 'raiment' ? <Shirt className="w-10 h-10 text-gray-400" /> : <Puzzle className="w-10 h-10 text-gray-400" />}
                 </div>
                 <p className="text-lg text-gray-300 font-serif tracking-widest">{gachaResult.message}</p>
              </motion.div>

              {/* Flavor Text (Conditional) */}
              {gachaTiltTriggered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 1, duration: 2 }}
                  className="mt-12 text-left"
                >
                  <p className="text-[10px] font-serif leading-loose tracking-wider animate-pulse" style={{ color: '#D1C7B7', animationDuration: '4s' }}>
                    『並非每一次的貪婪都會引來雷鳴。<br/>
                    有時候，您只是安靜地穿上一件舊衣；<br/>
                    而有時候，那 0.5 的重量，卻足以讓迷霧中的某人失去平衡。<br/>
                    賭局開始了，而您永遠不知道這一次，誰會為您的優雅買單。』
                  </p>
                </motion.div>
              )}

              <button 
                onClick={() => setGachaResultOpen(false)}
                className="mt-12 px-8 py-2 border border-gray-700 text-gray-500 text-xs hover:text-white hover:border-gray-500 transition-colors uppercase tracking-widest"
              >
                收納 (Accept)
              </button>
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
                    <div className="mb-6 p-4 bg-gray-900/30 border border-gray-800 rounded text-center">
                       <p className="text-xs text-gray-400 font-serif mb-4 italic">
                         「命運的輪盤正在轉動...」
                       </p>
                       <button 
                         onClick={() => {
                            if (!currentUser) return;
                            if (currentUser.coins < 8) {
                               alert('您的行囊太輕，無法轉動命運的齒輪。');
                               return;
                            }
                            handleGachaDraw();
                         }}
                         disabled={isGachaAnimating}
                         className={`w-full py-3 text-xs font-bold tracking-widest uppercase transition-all
                           ${isGachaAnimating 
                             ? 'bg-gray-800 text-gray-500 cursor-wait' 
                             : 'bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border border-yellow-700 text-yellow-100 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]'}`}
                       >
                         {isGachaAnimating ? '開啟中...' : '喚醒舊日衣櫃 (8 殘幣)'}
                       </button>
                       {currentUser && (
                         <p className="mt-2 text-[10px] text-gray-500 font-mono">
                           持有碎片: {currentUser.collected_shards || 0}
                         </p>
                       )}
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

      {/* 4. Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <div className="w-[400px] p-8 border border-gray-800 bg-black relative overflow-hidden shadow-2xl">
              {/* Decorative Lines */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
              
              <h3 className="text-2xl font-light text-center text-gray-200 tracking-[0.4em] mb-4 font-serif">IDENTITY VERIFICATION</h3>
              <p className="text-xs text-center text-gray-500 mb-8 font-mono leading-relaxed px-4">
                初次連結者，請署名你的代號。<br/>
                那串銘刻於靈魂的密鑰，將是你回歸的唯一憑證。
              </p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-widest">OC Name</label>
                  <input 
                    type="text" 
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="Enter OC Name..." 
                    className="w-full bg-gray-900 border border-gray-700 p-3 text-gray-300 focus:outline-none focus:border-white transition-colors text-sm font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-widest">Passcode</label>
                  <input 
                    type="password" 
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-gray-900 border border-gray-700 p-3 text-gray-300 focus:outline-none focus:border-white transition-colors text-sm font-mono" 
                  />
                </div>
                
                <button 
                  onClick={() => handleLogin(inputUsername, inputPassword)} 
                  className="w-full py-3 mt-4 bg-gray-200 text-black text-sm font-bold tracking-widest hover:bg-white transition-colors uppercase"
                >
                  Connect to Terminal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Common Player Call to Action (if not logged in) - Removed as Login is mandatory now */}

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