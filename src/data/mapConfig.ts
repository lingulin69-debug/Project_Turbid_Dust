import { NpcMapEntry } from '@/components/NpcInteractionModal';
import { Landmark } from '@/components/LandmarkStoryModal';

export const MAP_NPCS: NpcMapEntry[] = [
  { id: 'npc_bm1',  oc_name: 'BlackMerchantA', display_name: '老黑',     npc_role: 'black_merchant', x: 32, y: 55, is_open: true,  status_text: '今日開張，稀有貨不多' },
  { id: 'npc_inn1', oc_name: 'InnOwnerA',      display_name: '暖光旅店', npc_role: 'inn_owner',      x: 68, y: 35, is_open: true,  status_text: '今日接受治療與救援' },
  { id: 'npc_pm1',  oc_name: 'PetMerchantA',   display_name: '獸語人',   npc_role: 'pet_merchant',   x: 82, y: 60, is_open: false, status_text: '今日休息' },
];

// Updated Data with Types
export const landmarks: Landmark[] = [
  { id: 'l1_t01', name: '空衣街區', x: 20, y: 40, faction: 'Turbid', status: 'open', occupants: 2, capacity: 5, type: 'town' },
  { id: 'l1_t04', name: '舊鐘樓觀測所', x: 45, y: 30, faction: 'Turbid', status: 'open', occupants: 0, capacity: 3, type: 'school' },
  { id: 'l1_p01', name: '淨化尖塔', x: 75, y: 50, faction: 'Pure', status: 'open', occupants: 5, capacity: 10, type: 'church' },
  { id: 'l1_p02', name: '中央圖書館', x: 60, y: 65, faction: 'Pure', status: 'open', occupants: 1, capacity: 8, type: 'school' },
];

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export const announcements: Announcement[] = [
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

export interface Mission {
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

export const missions: Mission[] = [
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

export const NPC_ROLE_ICON: Record<NpcMapEntry['npc_role'], string> = {
  black_merchant: '🎭',
  trafficker:     '🪤',
  inn_owner:      '🏠',
  pet_merchant:   '🐾',
};

export const NPC_ROLE_LABEL: Record<NpcMapEntry['npc_role'], string> = {
  black_merchant: '黑心商人',
  trafficker:     '人販子',
  inn_owner:      '旅店老闆',
  pet_merchant:   '寵物商人',
};
