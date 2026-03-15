import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GazetteEntry {
  id: string;
  oc_name: string | null;
  landmark_id: string | null;
  gazette_type: 'mission' | 'system' | 'leader';
  gazette_content: string | null;
  faction: 'Turbid' | 'Pure' | null;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useGazette = (limit = 50) => {
  const [entries, setEntries] = useState<GazetteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/gazette/list?limit=${limit}`);
      if (!res.ok) return;
      const data: GazetteEntry[] = await res.json();
      setEntries(data);
    } catch (_) {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEntries();

    // Supabase Realtime — re-fetch on any new mission_log INSERT
    const channel = (supabase as any)
      .channel('gazette-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mission_logs' },
        () => fetchEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries]);

  return { entries, loading };
};
