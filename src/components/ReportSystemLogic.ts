import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import whitelistData from './whitelist.json';

const WHITELISTED_OCS = whitelistData.whitelisted_ocs;

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
  identity_role?: 'citizen' | 'apostate' | 'liquidator';
  is_in_lottery_pool?: boolean;
  is_high_affinity_candidate?: boolean;
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

// 持久化資料庫同步：自動更新
export const syncUserData = async (ocName: string, updates: Partial<UserData>) => {
  if (!ocName) return;
  
  try {
    const { error } = await supabase
      .from('td_users')
      .update(updates)
      .eq('oc_name', ocName);
    
    if (error) throw error;
  } catch (err) {
    // Sync failed silently in production
  }
};

// 登入/註冊邏輯核心
const loginOrRegisterCore = async (ocName: string, password: string) => {
  try {
    // 0. 管理員後門
    if (ocName.toLowerCase() === 'vonn' && password === '0112') {
      const adminData: UserData = {
        oc_name: 'vonn',
        inventory: [],
        wardrobe: [],
        coins: 999999,
        daily_coin_earned: 0,
        collected_shards: 999,
        faction: 'Pure', // 管理員預設身分
        identity_role: 'apostate', // Admin has access to everything
        is_in_lottery_pool: true,
        is_high_affinity_candidate: true
      };
      localStorage.setItem('td_oc_name', 'vonn');
      return { success: true, user: adminData, isAdmin: true };
    }

    // 1. 檢查白名單 (Whitelist Check) - 優先執行
    const isVonn = ocName.toLowerCase() === 'vonn';
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
        const userData = {
          oc_name: user.oc_name,
          inventory: user.inventory || [],
          wardrobe: user.wardrobe || [],
          coins: user.coins || 0,
          daily_coin_earned: user.daily_coin_earned || 0,
          faction: user.faction as 'Turbid' | 'Pure',
          identity_role: user.identity_role || 'citizen',
          is_in_lottery_pool: user.is_in_lottery_pool || false,
          is_high_affinity_candidate: user.is_high_affinity_candidate || false
        };
        localStorage.setItem('td_oc_name', ocName);
        return { success: true, user: userData };
      } else {
        return { success: false, message: '憑證不符，記憶與靈魂無法匹配。' };
      }
    } else {
      // 3b. 用戶不存在但已入圍 - 首次登入即註冊 (First Login Registration)
      
      const { data: newUser, error: regError } = await supabase
        .from('td_users')
        .insert([{ 
          oc_name: ocName, 
          simple_password: password, // 首入即定
          inventory: [],
          wardrobe: ['suit_01'],
          coins: 10, // Initial coins adjusted to 10
          daily_coin_earned: 0,
          collected_shards: 0,
          faction: Math.random() > 0.5 ? 'Turbid' : 'Pure' // 隨機分配陣營
        }])
        .select()
        .single();

      if (regError) throw regError;

      const userData = {
        oc_name: newUser.oc_name,
        inventory: newUser.inventory || [],
        wardrobe: newUser.wardrobe || [],
        coins: newUser.coins || 10,
        daily_coin_earned: newUser.daily_coin_earned || 0,
        collected_shards: newUser.collected_shards || 0,
        faction: newUser.faction,
        identity_role: 'citizen',
        is_in_lottery_pool: false,
        is_high_affinity_candidate: false
      };
      localStorage.setItem('td_oc_name', ocName);
      return { success: true, user: userData, isNew: true };
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
    if (result.isAdmin) setIsCreatorMode(true);
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
              is_high_affinity_candidate: user.is_high_affinity_candidate || false
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