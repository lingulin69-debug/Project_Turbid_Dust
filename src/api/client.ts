// Helper to switch between Supabase and Local API seamlessly
// Currently switched to Local API mode for Admin/System features.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = {
  admin: {
    getStats: async () => {
      const res = await fetch(`${API_BASE}/admin/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    runLottery: async (countPerFaction: number, chapter: string) => {
      const res = await fetch(`${API_BASE}/admin/lottery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countPerFaction, chapter })
      });
      if (!res.ok) throw new Error('Lottery failed');
      return res.json();
    },
    runLiquidatorSelect: async (countPerFaction: number, chapter: string) => {
      const res = await fetch(`${API_BASE}/admin/liquidator-select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countPerFaction, chapter })
      });
      if (!res.ok) throw new Error('Selection failed');
      return res.json();
    },
    getCandidates: async () => {
      const res = await fetch(`${API_BASE}/admin/candidates`);
      if (!res.ok) throw new Error('Failed to fetch candidates');
      return res.json();
    },
    getRegistry: async () => {
      const res = await fetch(`${API_BASE}/admin/registry`);
      if (!res.ok) throw new Error('Failed to fetch registry');
      return res.json();
    }
  },
  liquidator: {
    scan: async (targetUid: string, requesterFaction: string) => {
      const res = await fetch(`${API_BASE}/liquidator/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid, requesterFaction })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Scan failed');
      }
      return res.json();
    }
  },
  user: {
    get: async (username: string) => {
      const res = await fetch(`${API_BASE}/user/${username}`);
      if (!res.ok) return null;
      return res.json();
    }
  }
};
