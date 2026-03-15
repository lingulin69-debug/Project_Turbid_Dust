import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/api/client';

export interface DriftFragment {
  id: string;
  sender_oc: string;
  content: string;
  x_pct: number;
  y_pct: number;
}

/**
 * useDriftFragments
 * 載入並即時監聽漂流瓶（drift_fragments）。
 * 任何玩家投擲新殘卷，全體玩家地圖上即時出現。
 */
export const useDriftFragments = (chapter_version: string) => {
  const [fragments, setFragments] = useState<DriftFragment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初次載入：取得該章節所有漂流瓶
  useEffect(() => {
    const fetchFragments = async () => {
      setIsLoading(true);
      const data = await apiClient.drift.getFragments(chapter_version);
      setFragments(
        data.map(f => ({
          id: f.id,
          sender_oc: f.sender_oc,
          content: f.content,
          x_pct: Number(f.x_pct),
          y_pct: Number(f.y_pct),
        }))
      );
      setIsLoading(false);
    };

    fetchFragments();
  }, [chapter_version]);

  // Realtime 訂閱：新漂流瓶投入後即時 append
  useEffect(() => {
    const channel = supabase
      .channel('drift_fragments_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drift_fragments' },
        (payload) => {
          const row = payload.new as any;
          if (row.chapter_version !== chapter_version) return;
          setFragments(prev => {
            if (prev.find(f => f.id === row.id)) return prev; // 避免重複
            return [...prev, {
              id: row.id,
              sender_oc: row.sender_oc,
              content: row.content,
              x_pct: Number(row.x_pct),
              y_pct: Number(row.y_pct),
            }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapter_version]);

  // 投擲漂流瓶：呼叫 Express API（扣幣 + 寫入 DB + 更新天平）
  const placeFragment = useCallback(async (
    oc_name: string,
    content: string,
    x_pct: number,
    y_pct: number
  ) => {
    return apiClient.drift.place(oc_name, content, x_pct, y_pct, chapter_version);
  }, [chapter_version]);

  return { fragments, isLoading, placeFragment };
};
