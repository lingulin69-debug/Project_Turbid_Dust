// Helper to switch between Supabase and Local API seamlessly
// Currently switched to Local API mode for Admin/System features.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = {
  // Auth: 登入輔助
  auth: {
    setPassword: async (oc_name: string, new_password: string): Promise<{ success: boolean }> => {
      const res = await fetch(`${API_BASE}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name, new_password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Set password failed');
      }
      return res.json();
    }
  },

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
  apostate: {
    submitScreening: async (oc_name: string, answers: { question_id: string | number; answer: string }[]) => {
      const res = await fetch(`${API_BASE}/apostate/submit-screening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name, answers })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Submit screening failed');
      }
      return res.json();
    }
  },
  liquidator: {
    scan: async (scanner_oc: string, target_name: string, chapter_version: string) => {
      const res = await fetch(`${API_BASE}/liquidator/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanner_oc, target_name, chapter_version })
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
  },

  pets: {
    buy: async (buyer_oc: string, pet_id: string, chapter_version: string) => {
      const res = await fetch(`${API_BASE}/pets/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_oc, pet_id, chapter_version })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Buy pet failed');
      }
      return res.json() as Promise<{
        success: boolean;
        message: string;
        pet_id: string;
        coins_remaining: number;
        new_coins: number;
        pet: { id: string; name: string; description: string };
      }>;
    },
    release: async (oc_name: string, pet_id: string): Promise<{ success: boolean }> => {
      const res = await fetch(`${API_BASE}/pets/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name, pet_id })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Release pet failed');
      }
      return res.json();
    }
  },

  // Wave 1-A: 全局天平
  balance: {
    update: async (oc_name: string, delta: number) => {
      const res = await fetch(`${API_BASE}/balance/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name, delta })
      });
      if (!res.ok) throw new Error('Balance update failed');
      return res.json() as Promise<{ balance_value: number }>;
    }
  },

  // Wave 1-B: 漂流瓶
  drift: {
    place: async (oc_name: string, content: string, x_pct: number, y_pct: number, chapter_version: string) => {
      const res = await fetch(`${API_BASE}/drift/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name, content, x_pct, y_pct, chapter_version })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Drift place failed');
      }
      return res.json() as Promise<{ success: boolean; fragment_id: string }>;
    },
    getFragments: async (chapter: string) => {
      const res = await fetch(`${API_BASE}/drift/fragments?chapter=${encodeURIComponent(chapter)}`);
      if (!res.ok) return [];
      return res.json() as Promise<{ id: string; sender_oc: string; content: string; x_pct: number; y_pct: number }[]>;
    }
  },

  // Wave 1-C: 任務回報
  mission: {
    report: async (oc_name: string, mission_id: string, report_content: string, chapter_version: string, lock_mission_id?: string) => {
      const res = await fetch(`${API_BASE}/mission/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name, mission_id, report_content, chapter_version, lock_mission_id })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Report failed');
      }
      return res.json() as Promise<{ success: boolean; coins_earned: number; coins_total: number; weekly_coin_earned: number; reward: number; new_coins: number; capped?: boolean; message: string }>;
    },
    lock: async (oc_name: string, mission_id: string, chapter_version: string, action: 'check' | 'lock' | 'unlock' = 'check') => {
      const res = await fetch(`${API_BASE}/mission/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name, mission_id, chapter_version, action })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lock failed');
      }
      return res.json() as Promise<{ locked: boolean; reported: boolean; mission_id: string }>;
    }
  },

  // Wave 2: NPC API
  leader: {
    getStats: async (oc_name: string) => {
      const res = await fetch(`${API_BASE}/leader/stats?oc_name=${encodeURIComponent(oc_name)}`);
      if (!res.ok) throw new Error('Failed to fetch leader stats');
      return res.json() as Promise<{ leader_evil_points: number; leader_treasury: number; is_taxed_this_chapter: boolean; faction: string }>;
    },
    getDecrees: async (leader_oc: string, chapter = 'current') => {
      const res = await fetch(`${API_BASE}/leader/decrees?leader_oc=${encodeURIComponent(leader_oc)}&chapter=${encodeURIComponent(chapter)}`);
      if (!res.ok) return [];
      return res.json() as Promise<{ id: string; decree_type: string; content: string | null; target_oc: string | null; target_landmark_id: string | null; bounty_amount: number | null; bounty_completed: boolean; evil_points_cost: number; created_at: string }[]>;
    },
    tax: async (leader_oc: string) => {
      const res = await fetch(`${API_BASE}/leader/tax`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_oc })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '發布失敗'); }
      return res.json() as Promise<{ success: boolean; taxed_count: number; new_treasury: number }>;
    },
    curse: async (leader_oc: string, target_oc: string, prefix: string) => {
      const res = await fetch(`${API_BASE}/leader/curse`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_oc, target_oc, prefix })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '發布失敗'); }
      return res.json() as Promise<{ success: boolean }>;
    },
    law: async (leader_oc: string, content: string) => {
      const res = await fetch(`${API_BASE}/leader/law`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_oc, content })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '發布失敗'); }
      return res.json() as Promise<{ success: boolean }>;
    },
    bounty: async (leader_oc: string, target_oc: string, target_landmark_id: string, amount: 1 | 2) => {
      const res = await fetch(`${API_BASE}/leader/bounty`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_oc, target_oc, target_landmark_id, amount })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '發布失敗'); }
      return res.json() as Promise<{ success: boolean; decree_id: string }>;
    },
    curseTreasury: async (leader_oc: string) => {
      const res = await fetch(`${API_BASE}/leader/curse-treasury`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_oc })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '發布失敗'); }
      return res.json() as Promise<{ success: boolean }>;
    },
  },

  npc: {
    merchant: {
      listItem: async (merchant_oc: string, item_id: string, chapter_version: string, price: number) => {
        const res = await fetch(`${API_BASE}/npc/merchant/list-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_oc, item_id, chapter_version, price })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'List item failed');
        }
        return res.json() as Promise<{ success: boolean; slot_id: string }>;
      },
      getMarket: async (chapter: string) => {
        const res = await fetch(`${API_BASE}/npc/merchant/market?chapter_version=${encodeURIComponent(chapter)}`);
        if (!res.ok) return [];
        return res.json();
      },
      buy: async (buyer_oc: string, market_slot_id: string, chapter_version: string) => {
        const res = await fetch(`${API_BASE}/npc/merchant/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer_oc, market_slot_id, chapter_version })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Buy failed');
        }
        return res.json() as Promise<{ success: boolean; message: string; item_type: string; item_id: string | null; coins_remaining: number; new_coins: number; item: any; wardrobe_updated: boolean }>;
      }
    },
    trafficker: {
      kidnap: async (trafficker_oc: string, target_oc: string) => {
        const res = await fetch(`${API_BASE}/npc/trafficker/kidnap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trafficker_oc, target_oc })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Kidnap failed');
        }
        return res.json() as Promise<{ success: boolean; message: string }>;
      }
    },
    inn: {
      heal: async (inn_owner_oc: string, target_oc: string, dice_result: number) => {
        const res = await fetch(`${API_BASE}/npc/inn/heal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inn_owner_oc, target_oc, dice_result })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Heal failed');
        }
        return res.json() as Promise<{ success: boolean; new_hp: number; healed_amount: number }>;
      },
      rescue: async (rescuer_oc: string, target_oc: string) => {
        const res = await fetch(`${API_BASE}/npc/inn/rescue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rescuer_oc, target_oc })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Rescue failed');
        }
        return res.json() as Promise<{ success: boolean; message: string }>;
      }
    }
  }
};
