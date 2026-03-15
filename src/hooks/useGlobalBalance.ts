import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/api/client';

/**
 * useGlobalBalance
 * 從 Supabase global_stats 讀取全局天平數值，並透過 Realtime 監聽即時變化。
 * 所有玩家的呼氣/漂流瓶操作都會觸發此 hook 更新。
 */
export const useGlobalBalance = () => {
  const [balance, setBalance] = useState(50);
  const [isLoading, setIsLoading] = useState(true);

  // 初次載入：讀取當前天平數值
  useEffect(() => {
    const fetchInitial = async () => {
      const { data, error } = await (supabase as any)
        .from('global_stats')
        .select('balance_value')
        .eq('id', 'singleton')
        .maybeSingle();

      if (!error && data) {
        setBalance(data.balance_value);
      }
      setIsLoading(false);
    };

    fetchInitial();
  }, []);

  // Realtime 訂閱：任何玩家更新天平都即時反映
  useEffect(() => {
    const channel = supabase
      .channel('global_stats_balance')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'global_stats', filter: 'id=eq.singleton' },
        (payload) => {
          const newValue = (payload.new as { balance_value: number }).balance_value;
          if (typeof newValue === 'number') {
            setBalance(newValue);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 更新天平（呼叫 Express API，讓後端做 clamp 後寫入 Supabase）
  const updateBalance = useCallback(async (oc_name: string, delta: number) => {
    try {
      const result = await apiClient.balance.update(oc_name, delta);
      // Realtime 會自動推送新值，這裡不需要 setBalance
      return result;
    } catch (err) {
      console.error('[Balance] Update failed:', err);
    }
  }, []);

  return { balance, isLoading, updateBalance };
};
