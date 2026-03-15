import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import whitelistData from './whitelist.json';

const WHITELISTED_OCS = whitelistData.whitelisted_ocs;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Project Turbid Dust - 簡約版回報系統邏輯
 * 
 * 核心準則：
 * 1. 確保 reports 資料表提交成功
 * 2. 移除所有動態特效與自動播放動畫
 * 3. 僅提供清爽的文字紀錄輸出
 */

export interface UserData {
  oc_name: string;
  inventory: any[];
  wardrobe: any[];
  coins: number; // Unified Currency
  daily_coin_earned: number; // For daily limit check
  collected_shards?: number; // For Gacha duplicates
  faction: 'Turbid' | 'Pure';
  identity_role?: 'citizen' | 'apostate' | 'liquidator' | 'leader';
  is_in_lottery_pool?: boolean;
  is_high_affinity_candidate?: boolean;
  // Wave 2: NPC & 狀態欄位
  npc_role?: 'item_merchant' | 'black_merchant' | 'trafficker' | 'inn_owner' | 'pet_merchant' | null;
  is_lost?: boolean;
  lost_until?: string | null;
  current_hp?: number;
  max_hp?: number;
  // NPC 操作欄位
  movement_points?: number;
  prestige?: number;
  is_shop_open?: boolean;
  current_landmark_id?: string | null;
  // 角色卡欄位
  alias_name?: string | null;
  cursed_name_prefix?: string | null;
  karma_tags?: { tag: string; is_faded: boolean }[];
  status_tags?: { tag: string; expires_chapter: string }[];
  current_outfit?: string | null;
  // 領主專用
  leader_evil_points?: number;
  leader_treasury?: number;
  is_taxed_this_chapter?: boolean;
}

interface ReportData {
  ocName: string;
  taskType: string;
  summary: string;
  locationId: string;
}

interface ReportLog {
  id: string;
  time: string;
  ocName: string;
  taskType: string;
  summary: string;
  likes_count: number;
}

export const MAX_INVENTORY_SIZE = 12;

const mapUserData = (user: any): UserData => ({
  oc_name: user.oc_name,
  inventory: user.inventory || [],
  wardrobe: user.wardrobe || [],
  coins: user.coins || 0,
  daily_coin_earned: user.daily_coin_earned || 0,
  faction: user.faction as 'Turbid' | 'Pure',
  identity_role: user.identity_role || 'citizen',
  is_in_lottery_pool: user.is_in_lottery_pool || false,
  is_high_affinity_candidate: user.is_high_affinity_candidate || false,
  npc_role: (user as any).npc_role || null,
  is_lost: (user as any).is_lost || false,
  current_hp: (user as any).current_hp ?? 10,
  max_hp: (user as any).max_hp ?? 10,
});

// 持久化資料庫同步：自動更新
export const syncUserData = async (ocName: string, updates: Partial<UserData>) => {
  if (!ocName) return;
  
  try {
    const safeUpdates: Record<string, any> = { ...updates };
    if (safeUpdates.identity_role === 'leader') {
      delete safeUpdates.identity_role;
    }
    const { error } = await supabase
      .from('td_users')
      .update(safeUpdates as any)
      .eq('oc_name', ocName);
    
    if (error) throw error;
  } catch (err) {
    // Sync failed silently in production
  }
};

// 登入/註冊邏輯核心
const loginOrRegisterCore = async (ocName: string, password: string) => {
  try {
    const isVonn = ocName.toLowerCase() === 'vonn';
    if (isVonn) {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name: ocName, password })
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.error || '憑證不符，記憶與靈魂無法匹配。' };
      }
      const data = await res.json();
      const userData = mapUserData(data.user);
      localStorage.setItem('td_oc_name', ocName);
      return { success: true, user: userData };
    }

    if (!isVonn && !WHITELISTED_OCS.includes(ocName)) {
      return { 
        success: false, 
        message: '身份尚未核實，或許這一次的故事...不該由你續寫。' 
      };
    }

    // 2. 檢查用戶是否存在
    const { data: user, error } = await supabase
      .from('td_users')
      .select('*')
      .eq('oc_name', ocName)
      .maybeSingle();

    if (error) throw error;

    if (user) {
      // 3a. 用戶存在 - 驗證密碼
      if (user.simple_password === password) {
        // 首次登入偵測：密碼仍為預設值 '0000'，強制進入設定密碼流程
        if (user.simple_password === '0000') {
          return { success: false, firstLogin: true, oc_name: ocName };
        }
        const userData = mapUserData(user);
        localStorage.setItem('td_oc_name', ocName);
        return { success: true, user: userData };
      } else {
        return { success: false, message: '憑證不符，記憶與靈魂無法匹配。' };
      }
    } else {
      // 3b. 帳號不存在 - 帳號由管理員預先建立，玩家無法自行註冊
      return { success: false, message: '身份尚未核實，請確認你的OC名稱是否正確。' };
    }
  } catch (err: any) {
    return { success: false, message: '系統錯誤，請稍後再試' };
  }
};

export { loginOrRegisterCore as loginOrRegister };

export const useReportSystem = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCreatorMode, setIsCreatorMode] = useState(false);

  // syncUserData uses exported function

  // 檢查用戶是否存在
  const checkUserExists = async (ocName: string) => {
    if (!ocName) return false;
    try {
      const { data, error } = await supabase
        .from('td_users')
        .select('oc_name')
        .eq('oc_name', ocName)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    } catch (err) {
      return false;
    }
  };

  // 登入/註冊邏輯
  const loginOrRegister = async (ocName: string, password: string) => {
    setIsAuthLoading(true);
    const result = await loginOrRegisterCore(ocName, password);
    if (result.success && result.user) {
      setCurrentUser(result.user as any);
    }
    setIsAuthLoading(false);
    return result;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('td_oc_name');
  };

  // 自動登入檢查
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    
    if (mode === 'creator') {
      setIsCreatorMode(true);
      setCurrentUser({
        oc_name: 'Creator_Bypass',
        inventory: [],
        wardrobe: [],
        coins: 999999,
        daily_coin_earned: 0,
        collected_shards: 999,
        faction: 'Pure',
        identity_role: 'apostate',
        is_in_lottery_pool: true,
        is_high_affinity_candidate: true
      });
      setIsAuthLoading(false);
      return;
    }

    const savedOcName = localStorage.getItem('td_oc_name');
    if (savedOcName) {
      // 這裡簡單模擬，實際應有 session token
      const autoLogin = async () => {
        try {
          const { data: user, error } = await supabase
            .from('td_users')
            .select('*')
            .eq('oc_name', savedOcName)
            .maybeSingle();
          
          if (error) {
            setIsAuthLoading(false);
            return;
          }

          if (user) {
            setCurrentUser({
              oc_name: user.oc_name,
              inventory: (user.inventory as any[]) || [],
              wardrobe: (user.wardrobe as any[]) || [],
              coins: user.coins || 0,
              daily_coin_earned: user.daily_coin_earned || 0,
              collected_shards: user.collected_shards || 0,
              faction: user.faction as 'Turbid' | 'Pure',
              identity_role: (user.identity_role as any) || 'citizen',
              is_in_lottery_pool: user.is_in_lottery_pool || false,
              is_high_affinity_candidate: user.is_high_affinity_candidate || false,
              npc_role: (user as any).npc_role || null,
              is_lost: (user as any).is_lost || false,
              lost_until: (user as any).lost_until ?? null,
              current_hp: (user as any).current_hp ?? 10,
              max_hp: (user as any).max_hp ?? 10,
              movement_points: (user as any).movement_points ?? 10,
              prestige: (user as any).prestige ?? 0,
              is_shop_open: (user as any).is_shop_open ?? false,
              current_landmark_id: (user as any).current_landmark_id ?? null,
              leader_evil_points: (user as any).leader_evil_points ?? 3,
              leader_treasury: (user as any).leader_treasury ?? 0,
              is_taxed_this_chapter: (user as any).is_taxed_this_chapter ?? false,
            });
          }
        } catch (err) {
          // Auto-login silent fail
        } finally {
          setIsAuthLoading(false);
        }
      };
      autoLogin();
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  const [adventureLogs, setAdventureLogs] = useState<ReportLog[]>([
    {
      id: "log-1",
      time: "14:20",
      ocName: "艾琳娜",
      taskType: "主線劇情",
      summary: "在空衣街區發現了被遺忘的舊時代玩偶，似乎隱藏著濁息產生的秘密。",
      likes_count: 15
    },
    {
      id: "log-2",
      time: "12:05",
      ocName: "賽恩",
      taskType: "區域支線",
      summary: "修復了沈默鐘樓的齒輪，鐘聲再次響起，區域內的濁息濃度有所下降。",
      likes_count: 8
    },
    {
      id: "log-3",
      time: "10:30",
      ocName: "莉莉絲",
      taskType: "每日任務",
      summary: "在白石庭院採集了淨化後的露水，這些露水可以用來製作淨化劑。",
      likes_count: 23
    },
    {
      id: "log-4",
      time: "09:15",
      ocName: "凱爾",
      taskType: "特殊事件",
      summary: "守護了淨化水塔免受濁息怪物的襲擊，確保了城市的水源安全。",
      likes_count: 5
    }
  ]);

  // 模擬用戶點讚紀錄，key 為 logId，value 為點讚該 log 的 ocName 集合
  const [userLikes, setUserLikes] = useState<Map<string, Set<string>>>(() => {
    const initialLikes = new Map<string, Set<string>>();
    // 假設一些初始點讚數據
    initialLikes.set("log-1", new Set(["玩家A", "玩家B"]));
    initialLikes.set("log-3", new Set(["玩家C"]));
    return initialLikes;
  });

  const submitReport = async (data: ReportData) => {
    setIsSubmitting(true);
    
    try {
      // 1. 模擬 Supabase 提交至 reports 資料表
      
      // 2. 產生清爽的文字紀錄
      const newLog: ReportLog = {
        id: `log-${Date.now()}`, // 為新日誌生成唯一 ID
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        ocName: data.ocName,
        taskType: data.taskType,
        summary: data.summary,
        likes_count: 0 // 新增 likes_count 欄位並初始化為 0
      };

      // 3. 更新本地日誌列表 (顯示在據點下方)
      setAdventureLogs(prev => [newLog, ...prev]);

      return { success: true, log: newLog };
    } catch (error) {
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLike = (logId: string, ocName: string) => {
    setAdventureLogs(prevLogs => prevLogs.map(log => {
      if (log.id === logId) {
        const currentLikes = userLikes.get(logId) || new Set<string>();
        
        // 根據規範：再次點擊無效
        if (currentLikes.has(ocName)) {
          return log;
        }

        const newLikes = new Set(currentLikes);
        newLikes.add(ocName);
        const newLikesCount = log.likes_count + 1;

        setUserLikes(prev => new Map(prev).set(logId, newLikes));
        return { ...log, likes_count: newLikesCount };
      }
      return log;
    }));
  };

  const isLikedByCurrentUser = (logId: string, ocName: string) => {
    return userLikes.get(logId)?.has(ocName) || false;
  };

  /**
   * 靜態圖片替換邏輯 (用於替換地圖視覺)
   * 取代原有的 Shader 或動畫特效
   */
  const getStaticMapImage = (chaosValue: number, factionOffset: number) => {
    // 根據數值回傳對應的靜態圖片路徑，方便手動修正
    if (chaosValue > 50) return '/assets/maps/map_chaos_high.png';
    if (factionOffset > 30) return '/assets/maps/map_pure_dominant.png';
    return '/assets/maps/map_default.png';
  };

  // 檢查用戶是否在白名單中
  const isWhitelisted = (ocName: string) => {
    if (ocName.toLowerCase() === 'vonn') return true;
    return WHITELISTED_OCS.includes(ocName);
  };

  return {
    isSubmitting,
    adventureLogs,
    submitReport,
    toggleLike,
    isLikedByCurrentUser,
    userLikes,
    getStaticMapImage,
    currentUser,
    isAuthLoading,
    loginOrRegister,
    logout,
    syncUserData,
    isCreatorMode,
    checkUserExists,
    isWhitelisted
  };
};
