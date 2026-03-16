import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import express from 'express';
import cors from 'cors';
// import pkg from '@prisma/client';
// import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
// import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import itemsData from '../src/components/items.json' assert { type: 'json' };
import rescueDistanceData from '../src/data/rescue-distance.json' assert { type: 'json' };
import npcDeliverTexts from '../src/data/npc-deliver-texts.json' assert { type: 'json' };
import petTraits from '../src/data/pet-traits.json' assert { type: 'json' };
import partyEventsData from '../src/data/party-events.json' assert { type: 'json' };

// Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// ── 因果標籤寫入 helper ────────────────────────────────────────────────────
async function addKarmaTag(oc_name: string, tag_name: string): Promise<void> {
  try {
    const { data: user, error } = await supabaseServer
      .from('td_users')
      .select('karma_tags')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (error || !user) return;

    const tags: { tag: string; is_faded: boolean }[] = Array.isArray((user as any).karma_tags)
      ? (user as any).karma_tags
      : [];

    // 已有同名標籤則跳過
    if (tags.some(t => t.tag === tag_name)) return;

    // 現役標籤（is_faded=false）已有5個，將最舊的一個褪色
    const activeCount = tags.filter(t => !t.is_faded).length;
    const updatedTags = [...tags];
    if (activeCount >= 5) {
      const firstActiveIdx = updatedTags.findIndex(t => !t.is_faded);
      if (firstActiveIdx !== -1) updatedTags[firstActiveIdx] = { ...updatedTags[firstActiveIdx], is_faded: true };
    }

    updatedTags.push({ tag: tag_name, is_faded: false });

    await supabaseServer
      .from('td_users')
      .update({ karma_tags: updatedTags })
      .eq('oc_name', oc_name);

    await supabaseServer.from('player_notifications').insert({
      target_oc: oc_name,
      content: `你獲得了新的因果標籤【${tag_name}】`,
      notification_type: 'private',
    });
  } catch (_) {
    // 因果標籤為非關鍵路徑，靜默失敗
  }
}

// Build valid item IDs set from items.json (object with category arrays)
const VALID_ITEM_IDS = new Set<string>(
  Object.values(itemsData as unknown as Record<string, any[]>)
    .flat()
    .filter((item: any) => item && typeof item.id === 'string')
    .map((item: any) => item.id)
);

const MAX_INVENTORY_SIZE = 12;
const partyEvents = partyEventsData as any[];
const pickPartyEvent = (landmarkId: string, requiredCount: number) => {
  const candidates = partyEvents.filter((e: any) => e.landmark_id === landmarkId && e.required_count === requiredCount);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};
const getPartyEventById = (eventId?: string | null) => {
  if (!eventId) return null;
  return partyEvents.find((e: any) => e.id === eventId) || null;
};
const resolvePartyRequiredCount = (landmarkId: string, requestedCount?: number) => {
  const availableCounts = new Set(
    partyEvents.filter((e: any) => e.landmark_id === landmarkId).map((e: any) => e.required_count)
  );
  if (requestedCount === 1 || requestedCount === 3) {
    if (availableCounts.has(requestedCount)) return requestedCount;
  }
  if (availableCounts.has(3)) return 3;
  if (availableCounts.has(1)) return 1;
  return 3;
};
const resolveChapterVersion = (chapter?: string | null) => chapter || 'current';
const parseLandmarkIdFromMissionId = (missionId?: string | null) => {
  if (!missionId) return null;
  const parts = String(missionId).split('_').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
};

// const { PrismaClient } = pkg;

// const adapter = new PrismaBetterSqlite3({
//   url: process.env.DATABASE_URL ?? 'file:./dev.db'
// });

// const prisma = new PrismaClient({ adapter });
const app = express();

const port = 3001; // 匹配 README.md 中的端口文档

app.use(cors());
app.use(express.json());

const isAdminOc = (ocName?: string | null) => ocName?.toLowerCase() === 'vonn';
const extractRpcError = (error: any) => {
  const raw = String(error?.message || '').trim();
  if (!raw) return 'DB_ERROR';
  const parts = raw.split(':');
  return parts[parts.length - 1].trim();
};

// --- Routes ---

// DEV ONLY: Setup test users
app.post('/api/dev/setup-test-users', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is for development only.' });
  }

  const testUsers = [
    { oc_name: 'Vonn', faction: 'Turbid', identity_role: 'leader', leader_evil_points: 9, leader_treasury: 20, simple_password: '0000', is_in_party: false },
    { oc_name: 'PlayerA', faction: 'Turbid', simple_password: '0000', is_in_party: false },
    { oc_name: 'PlayerB', faction: 'Pure', simple_password: '0000', is_in_party: false },
    { oc_name: 'PlayerC', faction: 'Turbid', simple_password: '0000', is_in_party: false },
    { oc_name: 'PlayerD', faction: 'Pure', simple_password: '0000', is_in_party: false },
    { oc_name: 'LeaderA', faction: 'Turbid', identity_role: 'leader', leader_evil_points: 5, leader_treasury: 10, simple_password: '0000', is_in_party: false },
    { oc_name: 'EnemyPlayer', faction: 'Pure', simple_password: '0000', is_in_party: false },
    { oc_name: 'TraffickerA', faction: 'Neutral', npc_role: 'trafficker', movement_points: 3, prestige: 10, simple_password: '0000', is_in_party: false },
    { oc_name: 'InnOwnerA', faction: 'Neutral', npc_role: 'inn_owner', is_shop_open: true, simple_password: '0000', is_in_party: false },
    { oc_name: 'PetMerchantA', faction: 'Neutral', npc_role: 'pet_merchant', is_shop_open: false, simple_password: '0000', is_in_party: false },
    { oc_name: 'RescuerA', faction: 'Pure', coins: 10, simple_password: '0000', is_in_party: false },
    { oc_name: 'TargetE', faction: 'Turbid', is_lost: true, lost_until: new Date(Date.now() + 3600 * 1000).toISOString(), simple_password: '0000', is_in_party: false },
    { oc_name: 'TargetF', faction: 'Pure', simple_password: '0000', is_in_party: false },
  ];

  try {
    const userNames = testUsers.map(u => u.oc_name);
    await supabaseServer.from('td_users').update({ is_in_party: false }).in('oc_name', userNames);

    const { data: slots, error: slotsErr } = await supabaseServer
      .from('party_slots')
      .select('id, current_members, status')
      .in('status', ['open', 'full']);
    if (slotsErr) throw slotsErr;
    if (slots && slots.length > 0) {
      await Promise.all(slots.map(async (slot: any) => {
        const members: string[] = Array.isArray(slot.current_members) ? slot.current_members : [];
        const filteredMembers = members.filter(m => !userNames.includes(m));
        if (filteredMembers.length === members.length) return;
        const nextStatus = filteredMembers.length === 0 ? 'ended' : slot.status;
        const { error: updateErr } = await supabaseServer
          .from('party_slots')
          .update({ current_members: filteredMembers, status: nextStatus })
          .eq('id', slot.id);
        if (updateErr) throw updateErr;
      }));
    }

    const { error } = await supabaseServer.from('td_users').upsert(testUsers, { onConflict: 'oc_name', ignoreDuplicates: false });
    if (error) throw error;
    res.json({ success: true, message: 'Test users created/updated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 1. Get Stats (Admin)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { data: candidates } = await supabaseServer
      .from('td_users')
      .select('faction')
      .eq('is_high_affinity_candidate', true)
      .eq('identity_role', 'citizen');

    const { data: apostates } = await supabaseServer
      .from('td_users')
      .select('faction')
      .eq('identity_role', 'apostate');

    res.json({
      candidates: {
        turbid: candidates?.filter(u => u.faction === 'Turbid').length ?? 0,
        pure: candidates?.filter(u => u.faction === 'Pure').length ?? 0
      },
      apostates: {
        turbid: apostates?.filter(u => u.faction === 'Turbid').length ?? 0,
        pure: apostates?.filter(u => u.faction === 'Pure').length ?? 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Run Apostate Lottery (Admin)
// 每陣營固定抽 2 名（全局 4 名背道者，配額規定）
app.post('/api/admin/lottery', async (req, res) => {
  const countPerFaction: number = req.body.countPerFaction ?? 2;

  try {
    // 從 Supabase 查詢高適性候選人（citizen 且 is_high_affinity_candidate）
    const { data: candidates, error: queryError } = await supabaseServer
      .from('td_users')
      .select('id, oc_name, faction')
      .eq('is_high_affinity_candidate', true)
      .eq('identity_role', 'citizen');

    if (queryError) throw new Error(queryError.message);
    if (!candidates || candidates.length === 0) {
      return res.status(400).json({ error: '沒有符合條件的候選人，請確認問卷已正確寫入' });
    }

    const selectRandom = (arr: any[], n: number) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n);
    };

    const turbidPool = candidates.filter(u => u.faction === 'Turbid');
    const purePool = candidates.filter(u => u.faction === 'Pure');
    const selectedTurbid = selectRandom(turbidPool, countPerFaction);
    const selectedPure = selectRandom(purePool, countPerFaction);
    const allSelected = [...selectedTurbid, ...selectedPure];
    const selectedIds = allSelected.map(u => u.id);

    if (selectedIds.length === 0) {
      return res.status(400).json({ error: '候選人不足，無法完成抽選' });
    }

    // 寫入 identity_role = 'apostate'（統一值，永久鎖定）
    const { error: updateError } = await supabaseServer
      .from('td_users')
      .update({ identity_role: 'apostate' })
      .in('id', selectedIds);

    if (updateError) throw new Error(updateError.message);

    // 私人通知每位被選中的玩家（Cyan風格提示文案）
    const notifications = allSelected.map(u => ({
      target_oc: u.oc_name,
      content: '你被選中了。原因，不重要。\n\n你是這場棋局中的一道裂痕。你的行動只屬於你自己，痕跡模糊，不留證據。\n\n新的週期開始時，能力將被指派給你。',
      notification_type: 'popup'
    }));
    await supabaseServer.from('player_notifications').insert(notifications);

    res.json({
      success: true,
      selected: allSelected.map(u => ({
        oc_name: u.oc_name,
        faction: u.faction
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Run Liquidator Selection (Admin)
app.post('/api/admin/liquidator-select', async (req, res) => {
  const { countPerFaction, chapter } = req.body;

  try {
    const candidates = await prisma.td_users.findMany({
      where: { identity_role: 'citizen' }
    });

    const turbidCandidates = candidates.filter(u => u.faction === 'Turbid');
    const pureCandidates = candidates.filter(u => u.faction === 'Pure');

    const selectRandom = (arr: any[], n: number) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n);
    };

    const selectedTurbid = selectRandom(turbidCandidates, countPerFaction);
    const selectedPure = selectRandom(pureCandidates, countPerFaction);
    const allSelected = [...selectedTurbid, ...selectedPure];
    const selectedIds = allSelected.map(u => u.id);

    if (selectedIds.length > 0) {
      await prisma.td_users.updateMany({
        where: { id: { in: selectedIds } },
        data: { identity_role: 'liquidator' }
      });
    }

    res.json({ 
      success: true, 
      selected: allSelected.map(u => ({
        username: u.username,
        faction: u.faction,
        deviation: (Math.random() * (25 - 15) + 15).toFixed(2) + 'Hz'
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3-B. 適性問卷結果寫入（玩家完成問卷後呼叫）
app.post('/api/apostate/submit-screening', async (req, res) => {
  const { oc_name, answers } = req.body;
  if (!oc_name || !Array.isArray(answers)) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  try {
    const { data: existing, error: existingErr } = await supabaseServer
      .from('td_users')
      .select('is_in_lottery_pool')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (!existing) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if ((existing as any).is_in_lottery_pool) {
      return res.status(409).json({ error: 'SCREENING_ALREADY_SUBMITTED' });
    }

    const targetAnswers: Record<string, string> = {
      q1: 'A',
      q2: 'B',
      q3: 'A',
      q4: 'C',
      q5: 'A'
    };

    let score = 0;
    for (const ans of answers) {
      const rawId = ans?.question_id;
      const rawAnswer = ans?.answer;
      if (rawId == null || !rawAnswer) continue;
      const idText = String(rawId).replace(/^q/i, '');
      const key = `q${idText}`;
      const expected = targetAnswers[key];
      if (expected && String(rawAnswer).toUpperCase() === expected) score += 1;
    }

    const isHighAffinity = score >= 3;

    const { error } = await supabaseServer
      .from('td_users')
      .update({
        is_in_lottery_pool: true,
        is_high_affinity_candidate: isHighAffinity
      })
      .eq('oc_name', oc_name);

    if (error) throw new Error(error.message);
    res.json({ success: true, message: '問卷已記錄。' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apostate/select', async (req, res) => {
  const { oc_name, chapter_version } = req.body;
  if (!oc_name || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  try {
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, identity_role, is_high_affinity_candidate')
      .eq('oc_name', oc_name)
      .maybeSingle();

    if (userErr) throw userErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if ((user as any).identity_role === 'apostate') {
      return res.status(409).json({ error: 'ALREADY_APOSTATE' });
    }
    if (!(user as any).is_high_affinity_candidate) {
      return res.status(400).json({ error: 'NOT_HIGH_AFFINITY_CANDIDATE' });
    }

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ identity_role: 'apostate' })
      .eq('oc_name', oc_name);
    if (updateErr) throw updateErr;

    res.json({
      success: true,
      message: 'Apostate selected and identity locked.',
      updated_data: { identity_role: 'apostate' }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Liquidator Scan
app.post('/api/liquidator/scan', async (req, res) => {
  const { scanner_oc, target_name, chapter_version } = req.body;
  if (!scanner_oc || !target_name || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  try {
    const normalize = (value: string) => value.trim().toLowerCase().normalize('NFC');
    const normalizedTarget = normalize(target_name);
    const normalizedScanner = normalize(scanner_oc);

    const { data: users, error: usersErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, faction, identity_role');
    if (usersErr) throw usersErr;

    const scanner = (users || []).find((u: any) => normalize(u.oc_name) === normalizedScanner);
    if (!scanner) return res.status(404).json({ error: 'SCANNER_NOT_FOUND' });

    const target = (users || []).find((u: any) => normalize(u.oc_name) === normalizedTarget);
    if (!target) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });

    if (target.faction !== (scanner as any).faction) {
      return res.status(403).json({ error: 'CROSS_FACTION_SCAN_FORBIDDEN' });
    }

    res.json({
      result: target.identity_role === 'apostate' ? 'positive' : 'negative'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get User Info (Login/Sync)
app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const { data: user, error: uErr } = await supabaseServer
      .from('td_users')
      .select('*')
      .eq('oc_name', username)
      .maybeSingle();

    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/deduct-hp', async (req, res) => {
  const { oc_name, amount, chapter_version } = req.body;
  if (!oc_name || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  const deductAmount = amount == null ? 1 : Number(amount);
  if (!Number.isFinite(deductAmount) || deductAmount <= 0) {
    return res.status(400).json({ error: 'INVALID_AMOUNT' });
  }

  try {
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, current_hp')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const currentHp = (user as any).current_hp ?? 10;
    const newHp = Math.max(0, currentHp - deductAmount);
    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ current_hp: newHp })
      .eq('oc_name', oc_name);
    if (updateErr) throw updateErr;

    res.json({ success: true, current_hp: newHp, updated_data: { current_hp: newHp } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get High Affinity Candidates (Admin)
app.get('/api/admin/candidates', async (req, res) => {
  try {
    const candidates = await prisma.td_users.findMany({
      where: {
        is_high_affinity_candidate: true,
        identity_role: 'citizen'
      },
      select: {
        username: true,
        faction: true
      }
    });
    
    // Mock anomaly level for visualization
    const result = candidates.map(c => ({
      ...c,
      anomaly: Math.floor(Math.random() * (95 - 60) + 60) + '%'
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get Global Registry (Admin)
app.get('/api/admin/registry', async (req, res) => {
  try {
    const users = await prisma.td_users.findMany({
      select: {
        username: true,
        faction: true,
        identity_role: true
      }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Wave 1-A: 全局天平
// ============================================================

// 8. POST /api/balance/update
app.post('/api/balance/update', async (req, res) => {
  const { oc_name, delta } = req.body;
  if (!oc_name || typeof delta !== 'number') {
    return res.status(400).json({ error: 'Missing oc_name or delta' });
  }

  try {
    // 驗證玩家存在
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('oc_name')
      .eq('oc_name', oc_name)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 讀取當前天平值，clamp 後寫回
    const { data: stats, error: statsErr } = await supabaseServer
      .from('global_stats')
      .select('balance_value')
      .eq('id', 'singleton')
      .single();

    if (statsErr || !stats) {
      return res.status(500).json({ error: 'Failed to read global_stats' });
    }

    const newValue = Math.min(100, Math.max(0, stats.balance_value + delta));

    const { error: updateErr } = await supabaseServer
      .from('global_stats')
      .update({ balance_value: newValue, updated_at: new Date().toISOString() })
      .eq('id', 'singleton');

    if (updateErr) throw updateErr;

    res.json({ balance_value: newValue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Wave 1-B: 漂流瓶
// ============================================================

// 9. POST /api/drift/place
app.post('/api/drift/place', async (req, res) => {
  const { oc_name, content, x_pct, y_pct, chapter_version } = req.body;

  if (!oc_name || !content || x_pct == null || y_pct == null || !chapter_version) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 驗證玩家存在且有足夠硬幣
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, coins, faction')
      .eq('oc_name', oc_name)
      .maybeSingle();

    if (userErr || !user) return res.status(404).json({ error: 'User not found' });
    if ((user as any).coins < 5) return res.status(400).json({ error: 'Insufficient coins (need 5)' });

    // 扣幣
    const { error: coinErr } = await supabaseServer
      .from('td_users')
      .update({ coins: (user as any).coins - 5 })
      .eq('oc_name', oc_name);
    if (coinErr) throw coinErr;

    // 插入漂流瓶
    const { data: fragment, error: fragErr } = await supabaseServer
      .from('drift_fragments')
      .insert([{ sender_oc: oc_name, content, x_pct, y_pct, chapter_version }])
      .select('id')
      .single();
    if (fragErr) throw fragErr;

    // 更新天平（漂流瓶固定 5 的力度）
    const faction = (user as any).faction;
    const delta = faction === 'Pure' ? 5 : -5;
    const { data: stats } = await supabaseServer
      .from('global_stats')
      .select('balance_value')
      .eq('id', 'singleton')
      .single();
    if (stats) {
      const newBalance = Math.min(100, Math.max(0, (stats as any).balance_value + delta));
      await supabaseServer
        .from('global_stats')
        .update({ balance_value: newBalance, updated_at: new Date().toISOString() })
        .eq('id', 'singleton');
    }

    res.json({ success: true, fragment_id: (fragment as any).id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. GET /api/drift/fragments
app.get('/api/drift/fragments', async (req, res) => {
  const chapter = (req.query.chapter as string) || '1.0';
  try {
    const { data, error } = await supabaseServer
      .from('drift_fragments')
      .select('id, sender_oc, content, x_pct, y_pct')
      .eq('chapter_version', chapter)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Auth: 登入輔助
// ============================================================

// POST /api/auth/set-password
// 首次登入：玩家將預設密碼 '0000' 替換為自訂四位數字密碼
app.post('/api/auth/set-password', async (req, res) => {
  const { oc_name, new_password } = req.body;

  if (!oc_name || !new_password) {
    return res.status(400).json({ error: 'Missing oc_name or new_password' });
  }

  // 驗證：必須為四位數字
  if (!/^\d{4}$/.test(new_password)) {
    return res.status(400).json({ error: '密碼必須為四位數字' });
  }

  try {
    // 確認帳號存在且當前密碼仍為 '0000'
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, simple_password')
      .eq('oc_name', oc_name)
      .maybeSingle();

    if (userErr || !user) return res.status(404).json({ error: '帳號不存在' });
    if ((user as any).simple_password !== '0000') {
      return res.status(403).json({ error: '此帳號無需設定初始密碼' });
    }

    // 寫入新密碼
    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ simple_password: new_password })
      .eq('oc_name', oc_name);

    if (updateErr) throw updateErr;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/admin-login', async (req, res) => {
  const { oc_name, password } = req.body;
  if (!oc_name || !password) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD_NOT_SET' });
  }

  if (oc_name.toLowerCase() !== 'vonn' || password !== adminPassword) {
    return res.status(403).json({ error: 'INVALID_CREDENTIALS' });
  }

  try {
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('*')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
// 玩家登入：驗證 oc_name 和 simple_password
app.post('/api/auth/login', async (req, res) => {
  const { oc_name, password } = req.body;

  if (!oc_name || !password) {
    return res.status(400).json({ error: 'Missing oc_name or password' });
  }

  try {
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('*')
      .eq('oc_name', oc_name)
      .maybeSingle();

    if (userErr) throw userErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    if ((user as any).simple_password !== password) {
      return res.status(401).json({ error: 'INVALID_PASSWORD' });
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Wave 1-C: 任務回報
// ============================================================

// 11. POST /api/mission/report
app.post('/api/mission/report', async (req, res) => {
  const { oc_name, report_subject, report_content, mission_id, chapter_version, lock_mission_id } = req.body;

  if (!oc_name || !chapter_version || (!report_subject && !report_content && !mission_id)) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  const reportContent = (report_content || report_subject || '').trim();
  const missionId = (mission_id || report_subject || report_content || '').trim();

  if (!reportContent || !missionId) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  if (!/^.+-.+-.+$/.test(reportContent)) {
    return res.status(400).json({ error: '格式錯誤：請依照「章節-據點名稱-OC名稱」格式填寫' });
  }

  try {
    const lockMissionId = lock_mission_id || `main_${chapter_version}`;
    const { data, error } = await supabaseServer.rpc('report_mission_tx', {
      p_oc_name: oc_name,
      p_mission_id: missionId,
      p_report_content: reportContent,
      p_chapter_version: chapter_version,
      p_lock_mission_id: lockMissionId
    });
    if (error) {
      const code = extractRpcError(error);
      if (code === 'MISSION_ALREADY_LOCKED') return res.status(409).json({ error: code });
      if (code === 'CHAPTER_CAP_REACHED') return res.status(400).json({ error: code });
      if (code === 'USER_NOT_FOUND') return res.status(404).json({ error: code });
      return res.status(500).json({ error: code });
    }

    const bountyLandmarkId = parseLandmarkIdFromMissionId(missionId);
    if (bountyLandmarkId) {
      const chapter = resolveChapterVersion(chapter_version);
      const { data: bounties, error: bountyErr } = await supabaseServer
        .from('leader_decrees')
        .select('id, leader_oc, bounty_amount, bounty_completed')
        .eq('decree_type', 'bounty')
        .eq('target_oc', oc_name)
        .eq('target_landmark_id', bountyLandmarkId)
        .eq('chapter_version', chapter)
        .eq('bounty_completed', false);
      if (!bountyErr && bounties && bounties.length > 0) {
        const { data: playerRow } = await supabaseServer
          .from('td_users')
          .select('coins')
          .eq('oc_name', oc_name)
          .maybeSingle();
        let playerCoins = (playerRow as any)?.coins ?? 0;

        for (const bounty of bounties as any[]) {
          const amount = Number(bounty?.bounty_amount ?? 0);
          if (amount <= 0) continue;

          playerCoins += amount;
          await supabaseServer
            .from('td_users')
            .update({ coins: playerCoins })
            .eq('oc_name', oc_name);

          await supabaseServer
            .from('leader_decrees')
            .update({ bounty_completed: true, bounty_completed_by: oc_name })
            .eq('id', bounty.id);

          await supabaseServer.from('mission_logs').insert({
            oc_name: bounty.leader_oc,
            mission_id: `bounty-complete-${Date.now()}`,
            chapter_version: chapter,
            gazette_type: 'leader',
            gazette_content: `👑 懸賞已完成，${oc_name} 取得了 ${amount} 枚貨幣。`
          });
        }
      }
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12. POST /api/mission/lock
// 供前端主動查詢某任務是否已被鎖定（回報過）
app.post('/api/mission/lock', async (req, res) => {
  const { oc_name, mission_id, chapter_version, action } = req.body;

  if (!oc_name || !mission_id || !chapter_version) {
    return res.status(400).json({ error: 'Missing oc_name, mission_id, or chapter_version' });
  }

  try {
    const op = action || 'check';

    const { data: lock, error: lockErr } = await supabaseServer
      .from('mission_logs')
      .select('id, created_at')
      .eq('oc_name', oc_name)
      .eq('mission_id', mission_id)
      .eq('chapter_version', chapter_version)
      .eq('status', 'locked')
      .maybeSingle();

    if (lockErr) throw lockErr;

    const { data: reported, error: reportErr } = await supabaseServer
      .from('mission_logs')
      .select('id, created_at')
      .eq('oc_name', oc_name)
      .eq('mission_id', mission_id)
      .eq('chapter_version', chapter_version)
      .in('status', ['reported', 'approved'])
      .limit(1);

    if (reportErr) throw reportErr;

    if (op === 'check') {
      return res.json({ locked: !!lock, reported: !!(reported && reported.length > 0), mission_id });
    }

    if (op === 'unlock') {
      await supabaseServer
        .from('mission_logs')
        .delete()
        .eq('oc_name', oc_name)
        .eq('mission_id', mission_id)
        .eq('chapter_version', chapter_version)
        .eq('status', 'locked');

      return res.json({ locked: false, reported: !!(reported && reported.length > 0), mission_id });
    }

    if (op === 'lock') {
      if (reported && reported.length > 0) {
        return res.status(400).json({ error: '已完成本章任務，無法再鎖定' });
      }

      if (lock) {
        return res.json({ locked: true, reported: false, mission_id });
      }

      const { error: insertErr } = await supabaseServer
        .from('mission_logs')
        .insert([{
          oc_name,
          mission_id,
          report_content: 'locked',
          status: 'locked',
          chapter_version
        }]);
      if (insertErr) throw insertErr;

      return res.json({ locked: true, reported: false, mission_id });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Wave 2-A: 商人 NPC
// ============================================================

// 12. POST /api/npc/merchant/list-item
app.post('/api/npc/merchant/list-item', async (req, res) => {
  const {
    merchant_oc, item_type, item_id, custom_name, custom_description,
    price, chapter_version, dice_type, dice_results,
  } = req.body;

  if (!merchant_oc || !item_type || !chapter_version || price == null) {
    return res.status(400).json({ error: '缺少必要欄位' });
  }

  const VALID_ITEM_TYPES = ['item', 'outfit', 'custom', 'r18', 'dice_item'];
  if (!VALID_ITEM_TYPES.includes(item_type)) {
    return res.status(400).json({ error: '無效的商品類型' });
  }

  try {
    const { data: merchant, error: mErr } = await supabaseServer
      .from('td_users')
      .select('npc_role')
      .eq('oc_name', merchant_oc)
      .maybeSingle();

    if (mErr || !merchant) return res.status(404).json({ error: '商人不存在' });
    const role = (merchant as any).npc_role;
    if (role !== 'item_merchant' && role !== 'black_merchant') {
      return res.status(403).json({ error: '無商人權限' });
    }

    // 自製/R18/骰子商品需要名稱
    if (['custom', 'r18', 'dice_item'].includes(item_type) && !custom_name) {
      return res.status(400).json({ error: '此商品類型需要名稱' });
    }
    if (custom_description && custom_description.length > 30) {
      return res.status(400).json({ error: '描述不得超過30字' });
    }
    if (item_type === 'dice_item' && (!dice_type || !Array.isArray(dice_results) || !dice_results.length)) {
      return res.status(400).json({ error: '骰子商品需要骰子類型和結果設定' });
    }

    // 自製商品本章上限 3 件
    if (['custom', 'r18', 'dice_item'].includes(item_type)) {
      const { data: existing } = await supabaseServer
        .from('market_slots')
        .select('id')
        .eq('seller_oc', merchant_oc)
        .eq('chapter_version', chapter_version)
        .eq('is_sold', false)
        .in('item_type', ['custom', 'r18', 'dice_item']);
      if ((existing?.length ?? 0) >= 3) {
        return res.status(400).json({ error: '自製商品本章已達上架上限（3件）' });
      }
    }

    const insertData: any = {
      seller_oc: merchant_oc,
      seller_type: role,
      item_type,
      price,
      chapter_version,
    };
    if (item_id) insertData.item_id = item_id;
    if (custom_name) insertData.custom_name = custom_name;
    if (custom_description) insertData.custom_description = custom_description;
    if (item_type === 'dice_item') {
      insertData.requires_dice = true;
      insertData.dice_type = dice_type;
      insertData.dice_results = dice_results;
    }

    const { data: slot, error: slotErr } = await supabaseServer
      .from('market_slots')
      .insert([insertData])
      .select('id')
      .single();
    if (slotErr) throw slotErr;

    res.json({ success: true, slot_id: (slot as any).id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/npc/merchant/my-listings — 商人自己的上架列表
app.get('/api/npc/merchant/my-listings', async (req, res) => {
  const oc_name = req.query.oc_name as string;
  const chapter = (req.query.chapter as string) || '1.0';
  if (!oc_name) return res.status(400).json({ error: 'oc_name 必填' });
  try {
    const { data, error } = await supabaseServer
      .from('market_slots')
      .select('id, item_type, item_id, custom_name, custom_description, price, is_sold, dice_type, listed_at')
      .eq('seller_oc', oc_name)
      .eq('chapter_version', chapter)
      .order('listed_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. GET /api/npc/merchant/market
app.get('/api/npc/merchant/market', async (req, res) => {
  const chapter = (req.query.chapter_version as string) || (req.query.chapter as string) || '1.0';
  try {
    const { data, error } = await supabaseServer
      .from('market_slots')
      .select('id, seller_oc, item_id, item_type, custom_name, custom_description, price, listed_at')
      .eq('chapter_version', chapter)
      .eq('is_sold', false)
      .order('listed_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pets/buy
app.post('/api/pets/buy', async (req, res) => {
  const { buyer_oc, pet_id, chapter_version } = req.body;
  if (!buyer_oc || !pet_id || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  try {
    // 從 pet-traits.json 隨機抽取 personality 和 habit
    const personality = petTraits.personality[Math.floor(Math.random() * petTraits.personality.length)];
    const habit = petTraits.habit[Math.floor(Math.random() * petTraits.habit.length)];

    const { data, error } = await supabaseServer.rpc('buy_pet', {
      p_buyer_oc: buyer_oc,
      p_pet_id: pet_id,
      p_chapter_version: chapter_version,
      p_personality: personality,
      p_habit: habit
    });

    if (error) {
      const code = extractRpcError(error);
      if (code === 'PET_NOT_FOUND') return res.status(404).json({ error: code });
      if (code === 'PET_BLACKLISTED') return res.status(409).json({ error: code });
      if (code === 'PET_LIMIT_REACHED') return res.status(400).json({ error: code });
      if (code === 'INSUFFICIENT_COINS') return res.status(400).json({ error: code });
      if (code === 'BUYER_NOT_FOUND') return res.status(404).json({ error: code });
      return res.status(500).json({ error: code });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. POST /api/npc/merchant/buy
app.post('/api/npc/merchant/buy', async (req, res) => {
  const { buyer_oc, slot_id, market_slot_id, chapter_version } = req.body;
  const effectiveSlotId = market_slot_id || slot_id;

  if (!buyer_oc || !effectiveSlotId || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  try {
    const { data, error } = await supabaseServer.rpc('buy_market_item', {
      p_buyer_oc: buyer_oc,
      p_slot_id: effectiveSlotId,
      p_chapter_version: chapter_version
    });
    if (error) {
      const code = extractRpcError(error);
      if (code === 'SLOT_NOT_FOUND') return res.status(404).json({ error: code });
      if (code === 'ALREADY_SOLD') return res.status(409).json({ error: code });
      if (code === 'OUTFIT_ALREADY_OWNED') return res.status(409).json({ error: code });
      if (code === 'PET_BLACKLISTED') return res.status(409).json({ error: code });
      if (code === 'INSUFFICIENT_COINS') return res.status(400).json({ error: code });
      if (code === 'PET_LIMIT_REACHED') return res.status(400).json({ error: code });
      if (code === 'INVENTORY_FULL') return res.status(400).json({ error: code });
      if (code === 'MISSING_PET_ID') return res.status(400).json({ error: code });
      if (code === 'NPC_FORBIDDEN') return res.status(403).json({ error: code });
      if (code === 'INVALID_FACTION') return res.status(403).json({ error: code });
      if (code === 'SELF_PURCHASE_NOT_ALLOWED') return res.status(400).json({ error: code });
      if (code === 'BUYER_NOT_FOUND') return res.status(404).json({ error: code });
      if (code === 'DICE_ITEM_NOT_SUPPORTED') return res.status(400).json({ error: code });
      return res.status(500).json({ error: code });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Wave 2-B: 人販子 NPC
// ============================================================

app.post('/api/npc/trafficker/skill/kidnap', async (req, res) => {
  const { trafficker_oc, target_oc, chapter_version } = req.body;
  if (!trafficker_oc || !target_oc || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }
  try {
    const { data: trafficker, error: tErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige')
      .eq('oc_name', trafficker_oc)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!trafficker) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((trafficker as any).npc_role !== 'trafficker') return res.status(403).json({ error: 'NOT_A_TRAFFICKER' });
    if (((trafficker as any).prestige ?? 0) < 5) return res.status(400).json({ error: 'INSUFFICIENT_REPUTATION' });

    const { data: target, error: targetErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, is_lost, npc_role')
      .eq('oc_name', target_oc)
      .maybeSingle();
    if (targetErr) throw targetErr;
    if (!target) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
    if ((target as any).npc_role) return res.status(400).json({ error: 'TARGET_IS_NPC' });
    if ((target as any).is_lost) return res.status(400).json({ error: 'TARGET_ALREADY_LOST' });

    const lostUntil = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    await supabaseServer
      .from('td_users')
      .update({ prestige: (trafficker as any).prestige - 5 })
      .eq('oc_name', trafficker_oc);
    await supabaseServer
      .from('td_users')
      .update({ is_lost: true, lost_until: lostUntil })
      .eq('oc_name', target_oc);

    await supabaseServer.from('player_notifications').insert({
      target_oc,
      content: '你在黑暗中醒來，四周是陌生的氣味。你暫時無法行動。',
      notification_type: 'popup'
    });

    await supabaseServer.from('mission_logs').insert({
      oc_name: trafficker_oc,
      mission_id: `kidnap-${target_oc}-${Date.now()}`,
      chapter_version: resolveChapterVersion(chapter_version),
      gazette_type: 'system',
      gazette_content: `「${target_oc}」在黑霧中消失了`
    });

    await addKarmaTag(target_oc, '曾經消失的人');
    res.json({
      success: true,
      message: 'Player kidnapped successfully.',
      updated_data: {
        trafficker_prestige: (trafficker as any).prestige - 5,
        target_is_lost: true,
        target_lost_until: lostUntil
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/trafficker/skill/intel', async (req, res) => {
  const { trafficker_oc, chapter_version } = req.body;
  if (!trafficker_oc || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }
  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige, current_landmark_id')
      .eq('oc_name', trafficker_oc)
      .maybeSingle();
    if (nErr) throw nErr;
    if (!npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((npc as any).npc_role !== 'trafficker') return res.status(403).json({ error: 'NOT_A_TRAFFICKER' });
    if (((npc as any).prestige ?? 0) < 3) return res.status(400).json({ error: 'INSUFFICIENT_REPUTATION' });

    const landmarkId = (npc as any).current_landmark_id;
    if (!landmarkId) return res.status(400).json({ error: 'LANDMARK_NOT_FOUND' });

    const { data: logs, error: logErr } = await supabaseServer
      .from('mission_logs')
      .select('oc_name')
      .eq('landmark_id', landmarkId)
      .eq('chapter_version', resolveChapterVersion(chapter_version));
    if (logErr) throw logErr;

    const visitors = [...new Set((logs || []).map((l: any) => l.oc_name))];
    const newPrestige = (npc as any).prestige - 3;
    await supabaseServer
      .from('td_users')
      .update({ prestige: newPrestige })
      .eq('oc_name', trafficker_oc);

    res.json({ success: true, players_in_landmark: visitors, updated_data: { prestige: newPrestige } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/trafficker/skill/pickpocket', async (req, res) => {
  const { trafficker_oc, chapter_version } = req.body;
  if (!trafficker_oc || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }
  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige, coins')
      .eq('oc_name', trafficker_oc)
      .maybeSingle();
    if (nErr) throw nErr;
    if (!npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((npc as any).npc_role !== 'trafficker') return res.status(403).json({ error: 'NOT_A_TRAFFICKER' });
    if (((npc as any).prestige ?? 0) < 8) return res.status(400).json({ error: 'INSUFFICIENT_REPUTATION' });

    const { data: candidates, error: cErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, coins')
      .neq('oc_name', trafficker_oc)
      .eq('is_lost', false)
      .is('npc_role', null)
      .gt('coins', 0);
    if (cErr) throw cErr;
    if (!candidates || candidates.length === 0) {
      return res.status(400).json({ error: 'NO_TARGETS_AVAILABLE' });
    }

    const targetData = candidates[Math.floor(Math.random() * candidates.length)] as any;
    const stolen = Math.max(1, Math.floor(targetData.coins * 0.1));

    await supabaseServer
      .from('td_users')
      .update({ coins: targetData.coins - stolen })
      .eq('oc_name', targetData.oc_name);
    await supabaseServer
      .from('td_users')
      .update({
        coins: ((npc as any).coins ?? 0) + stolen,
        prestige: (npc as any).prestige - 8
      })
      .eq('oc_name', trafficker_oc);

    await supabaseServer.from('player_notifications').insert({
      target_oc: trafficker_oc,
      content: `帶走了${stolen}枚貨幣。`,
      notification_type: 'private'
    });
    await supabaseServer.from('player_notifications').insert({
      target_oc: targetData.oc_name,
      content: '你的貨幣少了一些，像是被人摸走的。',
      notification_type: 'private'
    });

    await addKarmaTag(targetData.oc_name, '口袋有洞的人');
    res.json({
      success: true,
      amount_stolen: stolen,
      updated_data: {
        trafficker_prestige: (npc as any).prestige - 8,
        trafficker_coins: ((npc as any).coins ?? 0) + stolen,
        target_oc: targetData.oc_name,
        target_coins: targetData.coins - stolen
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/trafficker/villager-mission', async (req, res) => {
  const { trafficker_oc, chapter_version, landmark_id } = req.body;
  if (!trafficker_oc || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }
  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige, current_landmark_id')
      .eq('oc_name', trafficker_oc)
      .maybeSingle();
    if (nErr) throw nErr;
    if (!npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((npc as any).npc_role !== 'trafficker') return res.status(403).json({ error: 'NOT_A_TRAFFICKER' });

    const resolvedLandmarkId = landmark_id || (npc as any).current_landmark_id;
    if (!resolvedLandmarkId) return res.status(404).json({ error: 'LANDMARK_NOT_FOUND' });
    if ((npc as any).current_landmark_id && (npc as any).current_landmark_id !== resolvedLandmarkId) {
      return res.status(403).json({ error: 'NOT_IN_LANDMARK' });
    }

    const texts = npcDeliverTexts as any[];
    const deliverText = texts.length > 0
      ? texts[Math.floor(Math.random() * texts.length)].text
      : '你完成了一件無人知曉的小事。';

    const currentPrestige = (npc as any).prestige ?? 0;
    const newPrestige = Math.min(10, currentPrestige + 3);
    await supabaseServer
      .from('td_users')
      .update({ prestige: newPrestige })
      .eq('oc_name', trafficker_oc);

    await supabaseServer
      .from('npc_actions')
      .insert({
        npc_oc: trafficker_oc,
        action_type: 'deliver',
        landmark_id: resolvedLandmarkId,
        result: deliverText,
        chapter_version: resolveChapterVersion(chapter_version)
      });

    res.json({
      success: true,
      reputation_gained: newPrestige - currentPrestige,
      current_reputation: newPrestige,
      mission_text: deliverText,
      updated_data: { prestige: newPrestige }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. POST /api/npc/trafficker/kidnap
app.post('/api/npc/trafficker/kidnap', async (req, res) => {
  const { trafficker_oc, target_oc } = req.body;

  if (!trafficker_oc || !target_oc) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: trafficker, error: tErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige')
      .eq('oc_name', trafficker_oc)
      .maybeSingle();

    if (tErr || !trafficker) return res.status(404).json({ error: '人販子不存在' });
    if ((trafficker as any).npc_role !== 'trafficker') return res.status(403).json({ error: '無人販子權限' });
    if (((trafficker as any).prestige ?? 0) < 5) return res.status(400).json({ error: '聲望不足（需5點）' });

    const { data: target, error: targetErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, is_lost')
      .eq('oc_name', target_oc)
      .maybeSingle();

    if (targetErr || !target) return res.status(404).json({ error: '目標不存在' });
    if ((target as any).is_lost) return res.status(400).json({ error: '目標已處於失蹤狀態' });

    const lostUntil = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    // 扣 5 聲望
    const { error: prestigeErr } = await supabaseServer
      .from('td_users')
      .update({ prestige: (trafficker as any).prestige - 5 })
      .eq('oc_name', trafficker_oc);
    if (prestigeErr) throw prestigeErr;

    // 設定目標失蹤
    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ is_lost: true, lost_until: lostUntil })
      .eq('oc_name', target_oc);
    if (updateErr) throw updateErr;

    // 強制彈窗通知目標
    const { error: notifErr } = await supabaseServer
      .from('player_notifications')
      .insert({
        target_oc,
        content: '你在黑暗中醒來，四周是陌生的氣味。你暫時無法行動。',
        notification_type: 'popup'
      });
    if (notifErr) throw notifErr;

    // 寫入小道消息（匿名代號暫用 target_oc，待匿名系統完成後替換）
    const { error: gazetteErr } = await supabaseServer
      .from('mission_logs')
      .insert({
        oc_name: trafficker_oc,
        mission_id: `kidnap-${target_oc}-${Date.now()}`,
        chapter_version: 'current',
        gazette_type: 'system',
        gazette_content: `「${target_oc}」在黑霧中消失了`
      });
    if (gazetteErr) throw gazetteErr;

    await addKarmaTag(target_oc, '曾經消失的人');

    res.json({ success: true, lost_until: lostUntil });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14-B. POST /api/npc/trafficker/deliver
app.post('/api/npc/trafficker/deliver', async (req, res) => {
  const { npc_oc, landmark_id } = req.body;

  if (!npc_oc || !landmark_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige, current_landmark_id')
      .eq('oc_name', npc_oc)
      .maybeSingle();

    if (nErr || !npc) return res.status(404).json({ error: '人販子不存在' });
    if ((npc as any).npc_role !== 'trafficker') return res.status(403).json({ error: '無人販子權限' });
    if ((npc as any).current_landmark_id !== landmark_id) {
      return res.status(403).json({ error: '人販子不在此據點' });
    }

    // 隨機抽取村民任務文本
    const texts = npcDeliverTexts as any[];
    const deliverText = texts.length > 0
      ? texts[Math.floor(Math.random() * texts.length)].text
      : '你完成了一件無人知曉的小事。';

    // prestige + 3，上限 10
    const currentPrestige = (npc as any).prestige ?? 0;
    const newPrestige = Math.min(10, currentPrestige + 3);

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ prestige: newPrestige })
      .eq('oc_name', npc_oc);
    if (updateErr) throw updateErr;

    // 寫入 npc_actions
    const { error: logErr } = await supabaseServer
      .from('npc_actions')
      .insert({
        npc_oc,
        action_type: 'deliver',
        landmark_id,
        result: deliverText,
        chapter_version: 'current'
      });
    if (logErr) throw logErr;

    res.json({ success: true, text: deliverText, new_prestige: newPrestige });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14-C. POST /api/npc/trafficker/intel
app.post('/api/npc/trafficker/intel', async (req, res) => {
  const { npc_oc, landmark_id } = req.body;

  if (!npc_oc || !landmark_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige')
      .eq('oc_name', npc_oc)
      .maybeSingle();

    if (nErr || !npc) return res.status(404).json({ error: '人販子不存在' });
    if ((npc as any).npc_role !== 'trafficker') return res.status(403).json({ error: '無人販子權限' });
    if (((npc as any).prestige ?? 0) < 3) return res.status(400).json({ error: '聲望不足（需3點）' });

    // 查詢本章到訪該據點的 oc_name（不重複）
    const { data: logs, error: logErr } = await supabaseServer
      .from('mission_logs')
      .select('oc_name')
      .eq('landmark_id', landmark_id)
      .eq('chapter_version', 'current');
    if (logErr) throw logErr;

    const visitors = [...new Set((logs || []).map((l: any) => l.oc_name))];

    const newPrestige = (npc as any).prestige - 3;
    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ prestige: newPrestige })
      .eq('oc_name', npc_oc);
    if (updateErr) throw updateErr;

    res.json({ success: true, visitors, new_prestige: newPrestige });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14-D. POST /api/npc/trafficker/pickpocket
app.post('/api/npc/trafficker/pickpocket', async (req, res) => {
  const { npc_oc } = req.body;

  if (!npc_oc) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, prestige, coins')
      .eq('oc_name', npc_oc)
      .maybeSingle();

    if (nErr || !npc) return res.status(404).json({ error: '人販子不存在' });
    if ((npc as any).npc_role !== 'trafficker') return res.status(403).json({ error: '無人販子權限' });
    if (((npc as any).prestige ?? 0) < 8) return res.status(400).json({ error: '聲望不足（需8點）' });

    // 查詢所有可偷目標：排除自己、is_lost、npc_role非NULL、coins=0
    const { data: candidates, error: cErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, coins')
      .neq('oc_name', npc_oc)
      .eq('is_lost', false)
      .is('npc_role', null)
      .gt('coins', 0);
    if (cErr) throw cErr;

    if (!candidates || candidates.length === 0) {
      return res.status(400).json({ error: '目前沒有可偷取的目標' });
    }

    const targetData = candidates[Math.floor(Math.random() * candidates.length)] as any;
    const stolen = Math.max(1, Math.floor(targetData.coins * 0.1));

    // 扣目標貨幣
    const { error: targetErr } = await supabaseServer
      .from('td_users')
      .update({ coins: targetData.coins - stolen })
      .eq('oc_name', targetData.oc_name);
    if (targetErr) throw targetErr;

    // 加人販子貨幣 + 扣 8 聲望
    const { error: npcUpdateErr } = await supabaseServer
      .from('td_users')
      .update({
        coins: ((npc as any).coins ?? 0) + stolen,
        prestige: (npc as any).prestige - 8
      })
      .eq('oc_name', npc_oc);
    if (npcUpdateErr) throw npcUpdateErr;

    // 私人通知人販子
    await supabaseServer.from('player_notifications').insert({
      target_oc: npc_oc,
      content: `帶走了${stolen}枚貨幣。`,
      notification_type: 'private'
    });

    // 私人通知目標
    await supabaseServer.from('player_notifications').insert({
      target_oc: targetData.oc_name,
      content: '你的貨幣少了一些，像是被人摸走的。',
      notification_type: 'private'
    });

    await addKarmaTag(targetData.oc_name, '口袋有洞的人');

    res.json({ success: true, stolen_amount: stolen, new_prestige: (npc as any).prestige - 8 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// NPC 移動（移動型 NPC 共用）
// ============================================================

// POST /api/npc/move
app.post('/api/npc/move', async (req, res) => {
  const { npc_oc, target_landmark_id } = req.body;

  if (!npc_oc || !target_landmark_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const MOVABLE_ROLES = ['item_merchant', 'black_merchant', 'trafficker'];

  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, movement_points, current_landmark_id')
      .eq('oc_name', npc_oc)
      .maybeSingle();

    if (nErr || !npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if (!MOVABLE_ROLES.includes((npc as any).npc_role)) {
      return res.status(403).json({ error: 'NOT_A_MOVABLE_NPC' });
    }
    if (((npc as any).movement_points ?? 0) < 1) {
      return res.status(400).json({ error: 'NO_MOVEMENT_POINTS' });
    }

    // 驗證目標據點 status = 'open'
    const { data: landmark, error: lErr } = await supabaseServer
      .from('td_world_map_landmarks')
      .select('id, status')
      .eq('id', target_landmark_id)
      .maybeSingle();

    if (lErr || !landmark) return res.status(404).json({ error: 'LANDMARK_NOT_FOUND' });
    if ((landmark as any).status !== 'open') {
      return res.status(400).json({ error: 'LANDMARK_CLOSED' });
    }

    const newPoints = (npc as any).movement_points - 1;

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ movement_points: newPoints, current_landmark_id: target_landmark_id })
      .eq('oc_name', npc_oc);
    if (updateErr) throw updateErr;

    // 寫入 npc_actions
    const { error: logErr } = await supabaseServer
      .from('npc_actions')
      .insert({
        npc_oc,
        action_type: 'move',
        landmark_id: target_landmark_id,
        chapter_version: 'current'
      });
    if (logErr) throw logErr;

    res.json({
      success: true,
      new_landmark_id: target_landmark_id,
      remaining_movement_points: newPoints,
      updated_data: { current_landmark_id: target_landmark_id, movement_points: newPoints }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Wave 2-C: 旅店老闆 NPC
// ============================================================

// 15. POST /api/npc/inn/heal
app.post('/api/npc/inn/heal', async (req, res) => {
  const { inn_owner_oc, target_oc, dice_result } = req.body;

  if (!inn_owner_oc || !target_oc || dice_result == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 驗證骰子範圍（1-20），防止前端竄改
  const diceNum = parseInt(dice_result, 10);
  if (isNaN(diceNum) || diceNum < 1 || diceNum > 20) {
    return res.status(400).json({ error: '無效的骰子結果' });
  }

  try {
    const { data: innOwner, error: iErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, is_shop_open')
      .eq('oc_name', inn_owner_oc)
      .maybeSingle();

    if (iErr || !innOwner) return res.status(404).json({ error: '旅店老闆不存在' });
    if ((innOwner as any).npc_role !== 'inn_owner') {
      return res.status(403).json({ error: '無旅店老闆權限' });
    }
    if (!(innOwner as any).is_shop_open) {
      return res.status(403).json({ error: '旅店今日休息' });
    }

    const { data: target, error: targetErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, coins, current_hp, max_hp')
      .eq('oc_name', target_oc)
      .maybeSingle();

    if (targetErr || !target) return res.status(404).json({ error: '目標不存在' });

    const t = target as any;
    if ((t.coins ?? 0) < 2) return res.status(400).json({ error: '貨幣不足' });

    const currentHp = t.current_hp ?? 10;
    const maxHp = t.max_hp ?? 10;
    const newHp = Math.min(maxHp, currentHp + diceNum);
    const healedAmount = newHp - currentHp;

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ current_hp: newHp, coins: t.coins - 2 })
      .eq('oc_name', target_oc);

    if (updateErr) throw updateErr;

    res.json({ success: true, new_hp: newHp, healed_amount: healedAmount, new_coins: t.coins - 2 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 16. POST /api/npc/inn/rescue
app.post('/api/npc/inn/rescue', async (req, res) => {
  const { inn_owner_oc, rescuer_oc, target_oc } = req.body;

  const ownerOc = inn_owner_oc || rescuer_oc;
  const payerOc = rescuer_oc || inn_owner_oc;

  if (!ownerOc || !payerOc || !target_oc) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: innOwner, error: iErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, is_shop_open, current_landmark_id')
      .eq('oc_name', ownerOc)
      .maybeSingle();

    if (iErr || !innOwner) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((innOwner as any).npc_role !== 'inn_owner') {
      return res.status(403).json({ error: 'NOT_AN_INN_OWNER' });
    }
    if (!(innOwner as any).is_shop_open) {
      return res.status(403).json({ error: 'INN_CLOSED' });
    }

    const { data: payer, error: payerErr } = await supabaseServer
      .from('td_users')
      .select('coins')
      .eq('oc_name', payerOc)
      .maybeSingle();
    if (payerErr || !payer) return res.status(404).json({ error: 'RESCUER_NOT_FOUND' });
    if (((payer as any).coins ?? 0) < 5) {
      return res.status(400).json({ error: 'INSUFFICIENT_COINS' });
    }

    const { data: target, error: targetErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, is_lost, current_landmark_id')
      .eq('oc_name', target_oc)
      .maybeSingle();

    if (targetErr || !target) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
    if (!(target as any).is_lost) return res.status(400).json({ error: 'TARGET_NOT_LOST' });

    // 距離判定：讀取 rescue-distance.json，若空則全部視為 mid（30分鐘）
    let minutesUntilRelease = 30;
    try {
      const rescueDistData = rescueDistanceData as any[];
      if (rescueDistData.length > 0) {
        const innLandmarkId = (innOwner as any).current_landmark_id;
        const targetLandmarkId = (target as any).current_landmark_id;
        const distConfig = rescueDistData.find((d: any) => d.inn_landmark_id === innLandmarkId);
        if (distConfig) {
          const zones: any[] = distConfig.distance_zones || [];
          const match = zones.find((z: any) => z.landmark_ids?.includes(targetLandmarkId));
          if (match?.zone === 'near') minutesUntilRelease = 10;
          else if (match?.zone === 'far') minutesUntilRelease = 60;
          // mid 維持 30
        }
      }
    } catch (_) { /* 讀取失敗沿用預設值 */ }

    const lostUntil = new Date(Date.now() + minutesUntilRelease * 60 * 1000).toISOString();

    // 扣除救援者 5 幣
    const { error: deductErr } = await supabaseServer
      .from('td_users')
      .update({ coins: (payer as any).coins - 5 })
      .eq('oc_name', payerOc);
    if (deductErr) throw deductErr;

    // 更新目標 lost_until（不立即清除 is_lost，由前端倒數或後端排程處理）
    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ lost_until: lostUntil })
      .eq('oc_name', target_oc);
    if (updateErr) throw updateErr;

    // 寫入通知給目標玩家
    const { error: notifErr } = await supabaseServer
      .from('player_notifications')
      .insert({
        target_oc,
        content: `有人正在把你找回來，預計${minutesUntilRelease}分鐘後恢復。`,
        notification_type: 'private'
      });
    if (notifErr) throw notifErr;

    // 寫入小道消息（gazette_type = 'system'）
    // 匿名代號暫用 target_oc，待匿名系統完成後替換
    const { error: gazetteErr } = await supabaseServer
      .from('mission_logs')
      .insert({
        oc_name: ownerOc,
        mission_id: `rescue-${target_oc}-${Date.now()}`,
        chapter_version: 'current',
        gazette_type: 'system',
        gazette_content: `「${target_oc}」從黑暗中被拉回來了`
      });
    if (gazetteErr) throw gazetteErr;

    res.json({
      success: true,
      message: 'Player rescue initiated.',
      updated_data: {
        rescuer_coins: (payer as any).coins - 5,
        target_lost_until: lostUntil,
        minutes_until_release: minutesUntilRelease
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/inn/toggle-open', async (req, res) => {
  const { inn_owner_oc, is_open } = req.body;
  if (!inn_owner_oc || typeof is_open !== 'boolean') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role')
      .eq('oc_name', inn_owner_oc)
      .maybeSingle();

    if (nErr || !npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((npc as any).npc_role !== 'inn_owner') {
      return res.status(403).json({ error: 'NOT_AN_INN_OWNER' });
    }

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ is_shop_open: is_open })
      .eq('oc_name', inn_owner_oc);

    if (updateErr) throw updateErr;
    res.json({ success: true, is_shop_open: is_open, updated_data: { is_shop_open: is_open } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 16-B. POST /api/npc/inn/toggle-shop
app.post('/api/npc/inn/toggle-shop', async (req, res) => {
  const { npc_oc } = req.body;

  if (!npc_oc) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role, is_shop_open')
      .eq('oc_name', npc_oc)
      .maybeSingle();

    if (nErr || !npc) return res.status(404).json({ error: 'NPC不存在' });
    if ((npc as any).npc_role !== 'inn_owner') {
      return res.status(403).json({ error: '無旅店老闆權限' });
    }

    const newState = !(npc as any).is_shop_open;

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ is_shop_open: newState })
      .eq('oc_name', npc_oc);

    if (updateErr) throw updateErr;

    res.json({ success: true, is_shop_open: newState });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Wave 3: 組隊系統
// ============================================================

// 17. POST /api/party/draw-card
app.post('/api/party/draw-card', async (req, res) => {
  const { oc_name, party_slot_id, party_id, position, chapter_version } = req.body;
  const resolvedPartyId = party_slot_id || party_id;
  if (!oc_name || !resolvedPartyId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hasPosition = position != null;
  const chosenPosition = hasPosition ? Number(position) : null;
  if (hasPosition && (!Number.isInteger(chosenPosition) || (chosenPosition as number) < 1)) {
    return res.status(400).json({ error: '無效的翻牌位置' });
  }

  try {
    const { data: slot, error: sErr } = await supabaseServer
      .from('party_slots')
      .select('*')
      .eq('id', resolvedPartyId)
      .maybeSingle();

    if (sErr || !slot) return res.status(404).json({ error: 'PARTY_NOT_FOUND' });

    const members: string[] = (slot as any).current_members || [];
    if (!members.includes(oc_name)) {
      return res.status(403).json({ error: 'NOT_IN_PARTY' });
    }
    if ((slot as any).status !== 'full') {
      return res.status(400).json({ error: '組隊尚未達標' });
    }

    const event = getPartyEventById((slot as any).event_id) || pickPartyEvent((slot as any).landmark_id, (slot as any).required_count);
    if (!event) return res.status(404).json({ error: '找不到組隊事件' });

    const cardLabels: string[] = event?.danger_version?.card_labels || [];
    const maxPosition = cardLabels.length > 0 ? cardLabels.length : ((slot as any).required_count === 1 ? 2 : 3);
    const resolvedPosition = hasPosition ? (chosenPosition as number) : Math.ceil(Math.random() * maxPosition);
    if (resolvedPosition > maxPosition) {
      return res.status(400).json({ error: '翻牌位置超出範圍' });
    }

    const existingResults: any[] = Array.isArray((slot as any).card_results) ? (slot as any).card_results : [];
    if (existingResults.some(r => r?.oc_name === oc_name)) {
      return res.status(409).json({ error: 'CARD_ALREADY_DRAWN' });
    }

    const expiresAt = (slot as any).expires_at ? new Date((slot as any).expires_at as string) : null;
    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

    if ((slot as any).triggered_event_type !== 'danger' || isExpired) {
      const updatedResults = [...existingResults, { oc_name, position: resolvedPosition, result: 'safe', hp_delta: 0 }];
      const { error: upErr } = await supabaseServer
        .from('party_slots')
        .update({ card_results: updatedResults })
        .eq('id', resolvedPartyId);
      if (upErr) throw upErr;

      const { data: safeUser } = await supabaseServer
        .from('td_users')
        .select('current_hp')
        .eq('oc_name', oc_name)
        .maybeSingle();

      return res.json({
        result: 'safe',
        card_result: 'safe',
        hp_deducted: 0,
        hp_delta: 0,
        ending_text: event?.danger_version?.ending_text ?? '',
        result_text: event?.danger_version?.result_safe_text ?? '',
        updated_data: {
          current_hp: (safeUser as any)?.current_hp ?? null,
          card_result: 'safe',
          card_results: updatedResults
        }
      });
    }

    const dangerPosition = (slot as any).danger_card_position as number | null;
    if (!dangerPosition) {
      return res.status(400).json({ error: '卡牌尚未初始化' });
    }

    const isDanger = resolvedPosition === dangerPosition;
    const { data: user, error: fetchErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, current_hp')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (fetchErr || !user) return res.status(404).json({ error: '玩家不存在' });

    const currentHp = (user as any).current_hp ?? 10;
    const newHp = isDanger ? Math.max(0, currentHp - 1) : currentHp;
    if (isDanger) {
      const { error: hpErr } = await supabaseServer
        .from('td_users')
        .update({ current_hp: newHp })
        .eq('oc_name', oc_name);
      if (hpErr) throw hpErr;
    }

    const updatedResults = [...existingResults, { oc_name, position: resolvedPosition, result: isDanger ? 'danger' : 'safe', hp_delta: isDanger ? -1 : 0 }];
    const { error: slotErr } = await supabaseServer
      .from('party_slots')
      .update({ card_results: updatedResults })
      .eq('id', resolvedPartyId);
    if (slotErr) throw slotErr;

    res.json({
      result: isDanger ? 'danger' : 'safe',
      card_result: isDanger ? 'ghost' : 'safe',
      hp_deducted: isDanger ? 1 : 0,
      hp_delta: isDanger ? -1 : 0,
      new_hp: newHp,
      ending_text: event?.danger_version?.ending_text ?? '',
      result_text: isDanger ? event?.danger_version?.result_danger_text ?? '' : event?.danger_version?.result_safe_text ?? '',
      updated_data: {
        current_hp: newHp,
        card_result: isDanger ? 'ghost' : 'safe',
        card_results: updatedResults
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 18. POST /api/party/join
app.post('/api/party/join', async (req, res) => {
  const { oc_name, landmark_id, chapter_version, required_count } = req.body;

  if (!oc_name || !landmark_id || !chapter_version) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 驗證玩家狀態
    const { data: player, error: pErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, is_lost, is_in_party')
      .eq('oc_name', oc_name)
      .maybeSingle();

    if (pErr || !player) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if ((player as any).is_lost) return res.status(403).json({ error: 'PLAYER_IS_LOST' });
    if ((player as any).is_in_party) return res.status(409).json({ error: 'ALREADY_IN_PARTY' });

    // 查詢該據點是否已有開放中的組隊槽
    const { data: existingSlot, error: sErr } = await supabaseServer
      .from('party_slots')
      .select('*')
      .eq('landmark_id', landmark_id)
      .eq('chapter_version', chapter_version)
      .eq('status', 'open')
      .maybeSingle();

    if (sErr) throw sErr;

    let slot: any;

    if (existingSlot) {
      // 加入現有組隊槽
      const members: string[] = (existingSlot as any).current_members || [];
      const required = Number((existingSlot as any).required_count) || 3;

      if (members.length >= required) {
        return res.status(409).json({ error: 'PARTY_FULL' });
      }

      if (members.includes(oc_name)) {
        return res.status(409).json({ error: '已在此組隊槽中' });
      }

      const updatedMembers = [...members, oc_name];
      const isFull = updatedMembers.length >= required;

      const updatePayload: any = { current_members: updatedMembers };

      if (isFull) {
        const eventType = Math.random() < 0.5 ? 'safe' : 'danger';
        const pickedEvent = pickPartyEvent(landmark_id, required);
        const cardCount = pickedEvent?.danger_version?.card_labels?.length || (required === 1 ? 2 : 3);
        const dangerPos = eventType === 'danger' ? Math.ceil(Math.random() * cardCount) : null;
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

        updatePayload.status = 'full';
        updatePayload.triggered_event_type = eventType;
        updatePayload.danger_card_position = dangerPos;
        updatePayload.expires_at = expiresAt;
        updatePayload.event_id = pickedEvent?.id ?? null;
      }

      const { data: updated, error: uErr } = await supabaseServer
        .from('party_slots')
        .update(updatePayload)
        .eq('id', (existingSlot as any).id)
        .select()
        .single();

      if (uErr) throw uErr;
      slot = updated;
    } else {
      // 新建組隊槽（預設 required_count = 3）
      const resolvedRequired = resolvePartyRequiredCount(landmark_id, required_count);
      const { data: newSlot, error: nErr } = await supabaseServer
        .from('party_slots')
        .insert({
          landmark_id,
          chapter_version,
          required_count: resolvedRequired,
          current_members: [oc_name],
          status: 'open'
        })
        .select()
        .single();

      if (nErr) throw nErr;
      slot = newSlot;
    }

    // 更新玩家 is_in_party = true
    const { error: upErr } = await supabaseServer
      .from('td_users')
      .update({ is_in_party: true })
      .eq('oc_name', oc_name);

    if (upErr) throw upErr;

    // 回傳時隱藏 danger_card_position
    const safeSlot = { ...slot, danger_card_position: undefined };

    res.json({
      success: true,
      party_id: safeSlot.id,
      party_slot: safeSlot,
      is_full: slot.status === 'full',
      updated_data: {
        is_in_party: true,
        party_status: slot.status,
        current_members: slot.current_members,
        triggered_event_type: slot.triggered_event_type ?? null
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 19. POST /api/party/end
app.post('/api/party/end', async (req, res) => {
  const { oc_name, party_slot_id } = req.body;

  if (!oc_name || !party_slot_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 查詢組隊槽
    const { data: slot, error: sErr } = await supabaseServer
      .from('party_slots')
      .select('*')
      .eq('id', party_slot_id)
      .maybeSingle();

    if (sErr || !slot) return res.status(404).json({ error: '組隊槽不存在' });

    const members: string[] = (slot as any).current_members || [];
    if (!members.includes(oc_name)) {
      return res.status(403).json({ error: '你不在此組隊中' });
    }

    // 寫入 party_event_logs
    const { error: logErr } = await supabaseServer
      .from('party_event_logs')
      .insert({
        party_slot_id,
        landmark_id: (slot as any).landmark_id,
        landmark_name: (slot as any).landmark_id, // 名稱由前端補充或留 id
        members: members,
        event_type: (slot as any).triggered_event_type || 'safe',
        chapter_version: (slot as any).chapter_version
      });

    if (logErr) throw logErr;

    // 更新組隊槽 status = 'ended'
    const { error: slotErr } = await supabaseServer
      .from('party_slots')
      .update({ status: 'ended' })
      .eq('id', party_slot_id);

    if (slotErr) throw slotErr;

    // 更新所有成員 is_in_party = false
    const { error: upErr } = await supabaseServer
      .from('td_users')
      .update({ is_in_party: false })
      .in('oc_name', members);

    if (upErr) throw upErr;

    res.json({ success: true });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/party/story', async (req, res) => {
  const { party_id, chapter_version } = req.query;

  if (!party_id || !chapter_version) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: slot, error: sErr } = await supabaseServer
      .from('party_slots')
      .select('*')
      .eq('id', party_id)
      .eq('chapter_version', chapter_version)
      .maybeSingle();

    if (sErr || !slot) return res.status(404).json({ error: 'PARTY_NOT_FOUND' });

    const event = getPartyEventById((slot as any).event_id) || pickPartyEvent((slot as any).landmark_id, (slot as any).required_count);
    if (!event) return res.status(404).json({ error: 'STORY_NOT_AVAILABLE' });

    const eventType = (slot as any).triggered_event_type === 'danger' ? 'danger' : 'safe';
    const version = eventType === 'danger' ? event.danger_version : event.safe_version;
    const scenes: any[] = Array.isArray(version?.scenes) ? version.scenes : [];
    const story_text = scenes.map(s => s?.text).filter(Boolean).join('\n');
    const choices = eventType === 'danger' && Array.isArray(version?.card_labels) ? version.card_labels : [];

    res.json({
      story_text,
      choices
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/party/report-mission
app.post('/api/party/report-mission', async (req, res) => {
  const { oc_name, mission_id, party_id, report_content, chapter_version } = req.body;

  if (!oc_name || !mission_id || !party_id || !report_content || !chapter_version) {
    return res.status(400).json({ error: 'MISSING_FIELDS' });
  }

  try {
    // 1. Verify player is in the specified party
    const { data: slot, error: slotErr } = await supabaseServer
      .from('party_slots')
      .select('current_members')
      .eq('id', party_id)
      .single();

    if (slotErr || !slot) {
      return res.status(404).json({ error: 'PARTY_NOT_FOUND' });
    }

    const members = slot.current_members || [];
    if (!members.includes(oc_name)) {
      return res.status(403).json({ error: 'NOT_IN_PARTY' });
    }

    const { data: existingLog, error: logCheckErr } = await supabaseServer
      .from('mission_logs')
      .select('id')
      .eq('oc_name', oc_name)
      .eq('mission_id', mission_id)
      .eq('chapter_version', chapter_version)
      .eq('party_id', party_id)
      .maybeSingle();

    if (logCheckErr) throw logCheckErr;

    if (existingLog) {
      return res.status(409).json({ error: 'MISSION_ALREADY_REPORTED' });
    }

    const insertPayload = {
      oc_name,
      mission_id,
      report_content,
      chapter_version,
      party_id,
      status: 'reported'
    };

    const { error: insertErr } = await supabaseServer
      .from('mission_logs')
      .insert(insertPayload);

    if (insertErr) throw insertErr;
    
    // 4. Add witness record to reporter's card (記錄見過的組員)
    const otherMembers = members.filter(m => m !== oc_name);
    let finalWitnessRecords: any[] = [];
    if (otherMembers.length > 0) {
        const { data: reporter } = await supabaseServer
            .from('td_users')
            .select('witness_records')
            .eq('oc_name', oc_name)
            .single();

        if (reporter) {
            const records: any[] = (reporter as any).witness_records || [];
            const newRecords = otherMembers
                .filter(memberOc => !records.some((r: any) => r.witness_oc === memberOc && r.mission_id === mission_id))
                .map(memberOc => ({
                    witness_oc: memberOc,
                    mission_id,
                    timestamp: new Date().toISOString()
                }));

            if (newRecords.length > 0) {
                finalWitnessRecords = [...records, ...newRecords];
                await supabaseServer
                    .from('td_users')
                    .update({ witness_records: finalWitnessRecords })
                    .eq('oc_name', oc_name);
            } else {
                finalWitnessRecords = records;
            }
        }
    }

    res.json({
      success: true,
      updated_data: {
        witness_records: finalWitnessRecords
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ============================================================
// Wave 4: 領主系統
// ============================================================

// POST /api/leader/tax 徵稅令
app.post('/api/leader/tax', async (req, res) => {
  const { leader_oc } = req.body;
  if (!leader_oc) return res.status(400).json({ error: 'MISSING_FIELDS' });

  try {
    const isAdmin = isAdminOc(leader_oc);
    const { data: leader, error: leaderErr } = await supabaseServer
      .from('td_users')
      .select('faction, identity_role, leader_evil_points, leader_treasury, is_taxed_this_chapter')
      .eq('oc_name', leader_oc)
      .maybeSingle();
    if (leaderErr) throw leaderErr;
    if (!leader) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if (!isAdmin && leader.identity_role !== 'leader') return res.status(403).json({ error: 'NOT_A_LEADER' });
    if (!isAdmin && (leader.leader_evil_points ?? 0) < 1) return res.status(400).json({ error: 'NO_EVIL_POINTS' });
    if (!isAdmin && leader.is_taxed_this_chapter) return res.status(400).json({ error: 'ALREADY_TAXED_THIS_CHAPTER' });

    // 查詢同陣營所有玩家（排除NPC、排除leader自己）
    const { data: targets, error: targetsErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, coins, mission_bonus_coins')
      .eq('faction', leader.faction)
      .in('identity_role', ['citizen', 'apostate'])
      .is('npc_role', null)
      .neq('oc_name', leader_oc);
    if (targetsErr) throw targetsErr;

    const taxable = (targets ?? []).filter(u => (u.coins ?? 0) > 0);
    const taxed_count = taxable.length;
    let new_treasury = (leader.leader_treasury ?? 0) + taxed_count;

    // 批次扣幣 + mission_bonus_coins +1 + 因果標籤
    for (const t of taxable) {
      await supabaseServer
        .from('td_users')
        .update({ coins: (t.coins ?? 0) - 1, mission_bonus_coins: ((t as any).mission_bonus_coins ?? 0) + 1 })
        .eq('oc_name', t.oc_name);
      await addKarmaTag(t.oc_name, '不差這一口的人');
    }

    // 更新領主狀態
    const nextEvilPoints = isAdmin ? (leader.leader_evil_points ?? 0) : (leader.leader_evil_points ?? 0) - 1;
    const { error: leaderUpErr } = await supabaseServer
      .from('td_users')
      .update({
        leader_evil_points: nextEvilPoints,
        leader_treasury: new_treasury,
        is_taxed_this_chapter: true
      })
      .eq('oc_name', leader_oc);
    if (leaderUpErr) throw leaderUpErr;

    // 寫入 leader_decrees
    await supabaseServer.from('leader_decrees').insert({
      leader_oc,
      faction: leader.faction,
      decree_type: 'tax',
      evil_points_cost: 1,
      chapter_version: 'current'
    });

    // 小道消息
    await supabaseServer.from('mission_logs').insert({
      oc_name: leader_oc,
      mission_id: `leader-tax-${Date.now()}`,
      chapter_version: 'current',
      gazette_type: 'leader',
      gazette_content: '👑 徵稅令已發布，所有人繳納一枚貨幣。'
    });

    res.json({
      success: true,
      message: 'Tax decree issued successfully.',
      taxed_count,
      new_treasury,
      updated_data: {
        leader_evil_points: nextEvilPoints,
        leader_treasury: new_treasury,
        taxed_players: taxable.map(t => t.oc_name)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leader/curse 命名詛咒
app.post('/api/leader/curse', async (req, res) => {
  const { leader_oc, target_oc, prefix } = req.body;
  if (!leader_oc || !target_oc || !prefix) return res.status(400).json({ error: 'MISSING_FIELDS' });

  try {
    const isAdmin = isAdminOc(leader_oc);
    const { data: leader, error: leaderErr } = await supabaseServer
      .from('td_users')
      .select('faction, identity_role, leader_evil_points')
      .eq('oc_name', leader_oc)
      .maybeSingle();
    if (leaderErr) throw leaderErr;
    if (!leader) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if (!isAdmin && leader.identity_role !== 'leader') return res.status(403).json({ error: 'NOT_A_LEADER' });
    if (!isAdmin && (leader.leader_evil_points ?? 0) < 1) return res.status(400).json({ error: 'NO_EVIL_POINTS' });

    // 驗證目標與領主同陣營
    const { data: target, error: targetErr } = await supabaseServer
      .from('td_users')
      .select('faction')
      .eq('oc_name', target_oc)
      .maybeSingle();
    if (targetErr) throw targetErr;
    if (!target) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
    if (target.faction !== leader.faction) return res.status(400).json({ error: 'CROSS_FACTION_CURSE_FORBIDDEN' });

    // 寫入詛咒前綴
    const { error: curseErr } = await supabaseServer
      .from('td_users')
      .update({ cursed_name_prefix: prefix })
      .eq('oc_name', target_oc);
    if (curseErr) throw curseErr;

    // 扣惡政點數
    const nextEvilPoints = isAdmin ? (leader.leader_evil_points ?? 0) : (leader.leader_evil_points ?? 0) - 1;
    const { error: leaderUpErr } = await supabaseServer
      .from('td_users')
      .update({ leader_evil_points: nextEvilPoints })
      .eq('oc_name', leader_oc);
    if (leaderUpErr) throw leaderUpErr;

    // 寫入 leader_decrees
    await supabaseServer.from('leader_decrees').insert({
      leader_oc,
      faction: leader.faction,
      decree_type: 'curse',
      target_oc,
      content: prefix,
      evil_points_cost: 1,
      chapter_version: 'current'
    });

    // 小道消息（匿名，不顯示真實OC名）
    await supabaseServer.from('mission_logs').insert({
      oc_name: leader_oc,
      mission_id: `leader-curse-${Date.now()}`,
      chapter_version: 'current',
      gazette_type: 'leader',
      gazette_content: '👑 命名詛咒已降下，某人將帶著新的名字行走。'
    });

    await addKarmaTag(target_oc, '被領主記得的人');

    res.json({
      success: true,
      message: 'Curse decree issued successfully.',
      updated_data: {
        target_cursed_name_prefix: prefix,
        leader_evil_points: nextEvilPoints
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leader/law 荒謬法令
app.post('/api/leader/law', async (req, res) => {
  const { leader_oc, content } = req.body;
  if (!leader_oc || !content) return res.status(400).json({ error: 'MISSING_FIELDS' });

  try {
    const isAdmin = isAdminOc(leader_oc);
    const { data: leader, error: leaderErr } = await supabaseServer
      .from('td_users')
      .select('faction, identity_role, leader_evil_points')
      .eq('oc_name', leader_oc)
      .maybeSingle();
    if (leaderErr) throw leaderErr;
    if (!leader) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if (!isAdmin && leader.identity_role !== 'leader') return res.status(403).json({ error: 'NOT_A_LEADER' });
    if (!isAdmin && (leader.leader_evil_points ?? 0) < 1) return res.status(400).json({ error: 'NO_EVIL_POINTS' });

    // 扣惡政點數
    const nextEvilPoints = isAdmin ? (leader.leader_evil_points ?? 0) : (leader.leader_evil_points ?? 0) - 1;
    const { error: leaderUpErr } = await supabaseServer
      .from('td_users')
      .update({ leader_evil_points: nextEvilPoints })
      .eq('oc_name', leader_oc);
    if (leaderUpErr) throw leaderUpErr;

    // 寫入 leader_decrees
    await supabaseServer.from('leader_decrees').insert({
      leader_oc,
      faction: leader.faction,
      decree_type: 'law',
      content,
      evil_points_cost: 1,
      chapter_version: 'current'
    });

    // 小道消息（直接顯示法令內容）
    await supabaseServer.from('mission_logs').insert({
      oc_name: leader_oc,
      mission_id: `leader-law-${Date.now()}`,
      chapter_version: 'current',
      gazette_type: 'leader',
      gazette_content: `👑 領主頒布了新的法令：${content}`
    });

    res.json({
      success: true,
      message: 'Law decree issued successfully.',
      updated_data: { leader_evil_points: nextEvilPoints }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leader/bounty', async (req, res) => {
  const { leader_oc, target_oc, landmark_id, reward_amount, chapter_version } = req.body;
  if (!leader_oc || !target_oc || !landmark_id || reward_amount == null || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  const amount = Number(reward_amount);
  if (![1, 2].includes(amount)) {
    return res.status(400).json({ error: 'INVALID_REWARD_AMOUNT' });
  }

  try {
    const isAdmin = isAdminOc(leader_oc);
    const { data: leader, error: leaderErr } = await supabaseServer
      .from('td_users')
      .select('faction, identity_role, leader_treasury')
      .eq('oc_name', leader_oc)
      .maybeSingle();
    if (leaderErr) throw leaderErr;
    if (!leader) return res.status(404).json({ error: 'LEADER_NOT_FOUND' });
    if (!isAdmin && leader.identity_role !== 'leader') return res.status(403).json({ error: 'NOT_A_LEADER' });
    if ((leader.leader_treasury ?? 0) < amount) return res.status(400).json({ error: 'INSUFFICIENT_TREASURY' });

    const { data: target, error: targetErr } = await supabaseServer
      .from('td_users')
      .select('faction')
      .eq('oc_name', target_oc)
      .maybeSingle();
    if (targetErr) throw targetErr;
    if (!target) return res.status(404).json({ error: 'TARGET_NOT_FOUND' });
    if (target.faction !== leader.faction) return res.status(400).json({ error: 'FACTION_MISMATCH' });

    const { data: landmark, error: landmarkErr } = await supabaseServer
      .from('td_world_map_landmarks')
      .select('id')
      .eq('id', landmark_id)
      .maybeSingle();
    if (landmarkErr) throw landmarkErr;
    if (!landmark) return res.status(404).json({ error: 'LANDMARK_NOT_FOUND' });

    const chapter = resolveChapterVersion(chapter_version);
    await supabaseServer
      .from('td_users')
      .update({ leader_treasury: (leader.leader_treasury ?? 0) - amount })
      .eq('oc_name', leader_oc);

    await supabaseServer.from('leader_decrees').insert({
      leader_oc,
      faction: leader.faction,
      decree_type: 'bounty',
      target_oc,
      target_landmark_id: landmark_id,
      bounty_amount: amount,
      bounty_completed: false,
      chapter_version: chapter
    });

    await supabaseServer.from('mission_logs').insert({
      oc_name: leader_oc,
      mission_id: `leader-bounty-${Date.now()}`,
      chapter_version: chapter,
      gazette_type: 'leader',
      gazette_content: `👑 懸賞令發布：${target_oc} 完成 ${landmark_id} 可得 ${amount} 枚貨幣。`
    });

    res.json({
      success: true,
      message: 'Bounty issued successfully.',
      updated_data: {
        leader_treasury: (leader.leader_treasury ?? 0) - amount,
        bounty_target: target_oc,
        bounty_landmark: landmark_id,
        bounty_amount: amount
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leader/curse-treasury', async (req, res) => {
  const { leader_oc, chapter_version } = req.body;
  if (!leader_oc || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  try {
    const isAdmin = isAdminOc(leader_oc);
    const { data: leader, error: leaderErr } = await supabaseServer
      .from('td_users')
      .select('faction, identity_role, leader_treasury')
      .eq('oc_name', leader_oc)
      .maybeSingle();
    if (leaderErr) throw leaderErr;
    if (!leader) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if (!isAdmin && leader.identity_role !== 'leader') return res.status(403).json({ error: 'NOT_A_LEADER' });
    if ((leader.leader_treasury ?? 0) < 8) return res.status(400).json({ error: 'INSUFFICIENT_TREASURY' });

    await supabaseServer
      .from('td_users')
      .update({ leader_treasury: 0 })
      .eq('oc_name', leader_oc);

    const { data: enemies, error: enemiesErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, status_tags')
      .neq('faction', leader.faction)
      .in('identity_role', ['citizen', 'apostate'])
      .is('npc_role', null);
    if (enemiesErr) throw enemiesErr;

    let cursed_target: string | null = null;
    if (enemies && enemies.length > 0) {
      const target = enemies[Math.floor(Math.random() * enemies.length)] as any;
      cursed_target = target.oc_name;
      const chapter = resolveChapterVersion(chapter_version);
      const tags = Array.isArray(target.status_tags) ? target.status_tags : [];
      if (!tags.some((t: any) => t?.tag === '本章貨幣上限-3' && t?.expires_chapter === chapter)) {
        await supabaseServer
          .from('td_users')
          .update({ status_tags: [...tags, { tag: '本章貨幣上限-3', expires_chapter: chapter }] })
          .eq('oc_name', target.oc_name);
      }
    }

    await supabaseServer.from('leader_decrees').insert({
      leader_oc,
      faction: leader.faction,
      decree_type: 'curse_treasury',
      evil_points_cost: 0,
      chapter_version: resolveChapterVersion(chapter_version)
    });

    await supabaseServer.from('mission_logs').insert({
      oc_name: leader_oc,
      mission_id: `leader-curse-treasury-${Date.now()}`,
      chapter_version: resolveChapterVersion(chapter_version),
      gazette_type: 'leader',
      gazette_content: '👑 詛咒金庫已啟動。'
    });

    res.json({
      success: true,
      message: 'Treasury cursed successfully.',
      updated_data: {
        leader_treasury: 0,
        cursed_enemy: cursed_target  // 僅後台可見，前端不顯示真實名稱
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/curse/remove', async (req, res) => {
  const { oc_name, chapter_version } = req.body;
  if (!oc_name || !chapter_version) {
    return res.status(422).json({ error: 'MISSING_FIELDS' });
  }

  try {
    const { data: user, error: userErr } = await supabaseServer
      .from('td_users')
      .select('coins, cursed_name_prefix')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if ((user as any).coins < 20) return res.status(400).json({ error: 'INSUFFICIENT_COINS' });

    await supabaseServer
      .from('td_users')
      .update({ coins: (user as any).coins - 20, cursed_name_prefix: null })
      .eq('oc_name', oc_name);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/player/pets - 獲取玩家擁有的寵物列表
app.get('/api/player/pets', async (req, res) => {
  const { oc_name } = req.query;
  if (!oc_name) {
    return res.status(400).json({ error: 'Missing oc_name' });
  }

  try {
    const { data: playerPets, error: ppErr } = await supabaseServer
      .from('player_pets')
      .select('*, pets(*)') // Select all from player_pets and join with pets table
      .eq('owner_oc', oc_name);

    if (ppErr) throw ppErr;

    res.json({ success: true, pets: playerPets || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pets/available - 獲取所有可購買的寵物列表
app.get('/api/pets/available', async (req, res) => {
  try {
    const { data: availablePets, error: apErr } = await supabaseServer
      .from('pets')
      .select('*')
      .eq('is_listed', true);

    if (apErr) throw apErr;

    res.json({ success: true, pets: availablePets || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/player/purchase-history - 獲取玩家的市集購買紀錄
app.get('/api/player/purchase-history', async (req, res) => {
  const { oc_name } = req.query;
  if (!oc_name) {
    return res.status(400).json({ error: 'Missing oc_name' });
  }

  try {
    const { data: purchaseHistory, error: phErr } = await supabaseServer
      .from('market_slots')
      .select('*')
      .eq('buyer_oc', oc_name)
      .eq('is_sold', true)
      .order('listed_at', { ascending: false });

    if (phErr) throw phErr;

    res.json({ success: true, history: purchaseHistory || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §1.1 角色卡
// ============================================================
app.get('/api/character-card/:oc_name', async (req, res) => {
  const { oc_name } = req.params;
  const { viewer_oc } = req.query as { viewer_oc?: string };
  try {
    const { data: user, error: uErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, faction, alias_name, cursed_name_prefix, current_outfit, wardrobe, karma_tags, status_tags, current_hp, max_hp, is_lost, witness_records')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    // Determine if viewer is same faction
    let isSameFaction = false;
    if (viewer_oc) {
      const { data: viewer } = await supabaseServer
        .from('td_users')
        .select('faction')
        .eq('oc_name', viewer_oc)
        .maybeSingle();
      isSameFaction = viewer?.faction === (user as any).faction;
    }

    const displayName = isSameFaction || !viewer_oc
      ? (user as any).oc_name
      : ((user as any).cursed_name_prefix ? `${(user as any).cursed_name_prefix}${(user as any).alias_name || oc_name}` : (user as any).alias_name || `匿名_${oc_name.slice(0, 3)}`);

    // Pets
    const { data: pets } = await supabaseServer
      .from('player_pets')
      .select('pet_id, pets(name, description)')
      .eq('owner_oc', oc_name)
      .eq('is_released', false);

    res.json({
      oc_name: (user as any).oc_name,
      faction: (user as any).faction,
      display_name: displayName,
      avatar_url: (user as any).current_outfit || null,
      wardrobe: (user as any).wardrobe || [],
      karma_tags: (user as any).karma_tags || [],
      faded_marks: [],
      hp: (user as any).current_hp ?? 10,
      max_hp: (user as any).max_hp ?? 10,
      status_effects: (user as any).status_tags || [],
      witness_records: (user as any).witness_records || [],
      pets: (pets || []).map((p: any) => ({ pet_id: p.pet_id, name: p.pets?.name, description: p.pets?.description }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// P2 §1.2 選擇衣裝
app.post('/api/character-card/select-outfit', async (req, res) => {
  const { oc_name, outfit_id, chapter_version } = req.body;
  if (!oc_name || !outfit_id) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: user, error: uErr } = await supabaseServer
      .from('td_users')
      .select('wardrobe')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const wardrobe: string[] = (user as any).wardrobe || [];
    if (!wardrobe.includes(outfit_id)) return res.status(403).json({ error: 'OUTFIT_NOT_OWNED' });

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ current_outfit: outfit_id })
      .eq('oc_name', oc_name);
    if (updateErr) throw updateErr;

    res.json({ success: true, current_outfit_id: outfit_id, updated_data: { current_outfit: outfit_id } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// P2 §1.3 流放寵物
app.post('/api/character-card/banish-pet', async (req, res) => {
  const { oc_name, pet_id, chapter_version } = req.body;
  if (!oc_name || !pet_id) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: user } = await supabaseServer.from('td_users').select('oc_name').eq('oc_name', oc_name).maybeSingle();
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const { data: playerPet, error: petErr } = await supabaseServer
      .from('player_pets')
      .select('id, is_released')
      .eq('owner_oc', oc_name)
      .eq('pet_id', pet_id)
      .maybeSingle();
    if (petErr) throw petErr;
    if (!playerPet) return res.status(404).json({ error: 'PET_NOT_OWNED' });
    if ((playerPet as any).is_released) return res.status(400).json({ error: 'PET_ALREADY_BANISHED' });

    const { error: updateErr } = await supabaseServer
      .from('player_pets')
      .update({ is_released: true, released_at: new Date().toISOString() })
      .eq('id', (playerPet as any).id);
    if (updateErr) throw updateErr;

    await addKarmaTag(oc_name, '心如磐石的人');
    res.json({ success: true, message: '你放開了牠的爪子，牠消失在霧裡。', updated_data: { pet_id, is_released: true } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §2.1 小道消息
// ============================================================
app.get('/api/gossip', async (req, res) => {
  const { chapter_version } = req.query as { chapter_version?: string };
  const cv = chapter_version ? resolveChapterVersion(chapter_version) : 'ch01_v3';
  try {
    const { data: logs, error: lErr } = await supabaseServer
      .from('mission_logs')
      .select('id, oc_name, gazette_type, gazette_content, created_at')
      .not('gazette_content', 'is', null)
      .eq('chapter_version', cv)
      .order('created_at', { ascending: false })
      .limit(100);
    if (lErr) throw lErr;

    const { data: decrees, error: dErr } = await supabaseServer
      .from('leader_decrees')
      .select('id, leader_oc, faction, decree_type, content, created_at')
      .eq('chapter_version', cv)
      .order('created_at', { ascending: false })
      .limit(50);
    if (dErr) throw dErr;

    const gossipFeed = [
      ...(logs || []).map((l: any) => ({
        id: l.id,
        gazette_type: l.gazette_type || 'system',
        gazette_content: l.gazette_content,
        oc_name: l.oc_name,
        landmark_id: l.landmark_id || null,
        faction: null,
        created_at: l.created_at
      })),
      ...(decrees || []).map((d: any) => ({
        id: d.id,
        gazette_type: 'leader' as const,
        gazette_content: d.content,
        oc_name: d.leader_oc,
        landmark_id: null,
        faction: d.faction || null,
        created_at: d.created_at
      }))
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ gossip_feed: gossipFeed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §3 通知系統
// ============================================================
app.get('/api/notifications/private/:oc_name', async (req, res) => {
  const { oc_name } = req.params;
  try {
    const { data: user } = await supabaseServer.from('td_users').select('oc_name').eq('oc_name', oc_name).maybeSingle();
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const { data: notifs, error: nErr } = await supabaseServer
      .from('player_notifications')
      .select('id, content, notification_type, is_read, created_at')
      .eq('target_oc', oc_name)
      .eq('notification_type', 'private')
      .order('created_at', { ascending: false });
    if (nErr) throw nErr;

    res.json({ notifications: (notifs || []).map((n: any) => ({
      id: n.id, type: 'private', timestamp: n.created_at, content: n.content, is_read: n.is_read
    })) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  const { oc_name, notification_id } = req.body;
  if (!oc_name || !notification_id) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: user } = await supabaseServer.from('td_users').select('oc_name').eq('oc_name', oc_name).maybeSingle();
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const { data: notif, error: nErr } = await supabaseServer
      .from('player_notifications')
      .select('id, target_oc')
      .eq('id', notification_id)
      .maybeSingle();
    if (nErr) throw nErr;
    if (!notif) return res.status(404).json({ error: 'NOTIFICATION_NOT_FOUND' });
    if ((notif as any).target_oc !== oc_name) return res.status(403).json({ error: 'NOT_YOUR_NOTIFICATION' });

    const { error: updateErr } = await supabaseServer
      .from('player_notifications')
      .update({ is_read: true })
      .eq('id', notification_id);
    if (updateErr) throw updateErr;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/popup/:oc_name', async (req, res) => {
  const { oc_name } = req.params;
  try {
    const { data: user } = await supabaseServer.from('td_users').select('oc_name, is_lost, lost_until').eq('oc_name', oc_name).maybeSingle();
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const popups: any[] = [];
    if ((user as any).is_lost && (user as any).lost_until) {
      const remaining = Math.max(0, Math.floor((new Date((user as any).lost_until).getTime() - Date.now()) / 1000));
      popups.push({
        id: `kidnapped_${oc_name}`,
        type: 'kidnapped',
        timestamp: new Date().toISOString(),
        content: '你被帶走了，暫時無法行動。',
        countdown_seconds: remaining
      });
    }

    // Also check popup notifications
    const { data: notifs } = await supabaseServer
      .from('player_notifications')
      .select('id, content, created_at')
      .eq('target_oc', oc_name)
      .eq('notification_type', 'popup')
      .eq('is_read', false);

    res.json({ popup_notifications: [...popups, ...(notifs || []).map((n: any) => ({
      id: n.id, type: 'system', timestamp: n.created_at, content: n.content, countdown_seconds: null
    }))] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §4 寵物商人
// ============================================================
app.post('/api/npc/pet-merchant/toggle-open', async (req, res) => {
  const { pet_merchant_oc, is_open, chapter_version } = req.body;
  if (!pet_merchant_oc || typeof is_open !== 'boolean') return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: npc, error: nErr } = await supabaseServer
      .from('td_users')
      .select('npc_role')
      .eq('oc_name', pet_merchant_oc)
      .maybeSingle();
    if (nErr) throw nErr;
    if (!npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((npc as any).npc_role !== 'pet_merchant') return res.status(403).json({ error: 'NOT_A_PET_MERCHANT' });

    const { error: updateErr } = await supabaseServer
      .from('td_users')
      .update({ is_shop_open: is_open })
      .eq('oc_name', pet_merchant_oc);
    if (updateErr) throw updateErr;

    res.json({ success: true, is_shop_open: is_open, updated_data: { is_shop_open: is_open } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/pet-merchant/list-default-pet', async (req, res) => {
  const { pet_merchant_oc, pet_id, chapter_version } = req.body;
  if (!pet_merchant_oc || !pet_id || !chapter_version) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: npc } = await supabaseServer.from('td_users').select('npc_role').eq('oc_name', pet_merchant_oc).maybeSingle();
    if (!npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((npc as any).npc_role !== 'pet_merchant') return res.status(403).json({ error: 'NOT_A_PET_MERCHANT' });

    const cv = resolveChapterVersion(chapter_version);
    const { data: existing } = await supabaseServer.from('pets').select('id').eq('id', pet_id).eq('is_preset', true).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'PET_NOT_FOUND' });

    // Check max 3 default pets listed this chapter
    const { data: listed } = await supabaseServer.from('pets').select('id').eq('seller_oc', pet_merchant_oc).eq('chapter_version', cv).eq('is_preset', true).eq('is_listed', true);
    if ((listed || []).length >= 3) return res.status(400).json({ error: 'MAX_DEFAULT_PETS_REACHED' });

    const { error: updateErr } = await supabaseServer
      .from('pets')
      .update({ is_listed: true, seller_oc: pet_merchant_oc, chapter_version: cv })
      .eq('id', pet_id);
    if (updateErr) throw updateErr;

    res.json({ success: true, message: 'Default pet listed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/pet-merchant/list-custom-pet', async (req, res) => {
  const { pet_merchant_oc, name, description, image_url, price, chapter_version } = req.body;
  if (!pet_merchant_oc || !name || !chapter_version) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: npc } = await supabaseServer.from('td_users').select('npc_role').eq('oc_name', pet_merchant_oc).maybeSingle();
    if (!npc) return res.status(404).json({ error: 'NPC_NOT_FOUND' });
    if ((npc as any).npc_role !== 'pet_merchant') return res.status(403).json({ error: 'NOT_A_PET_MERCHANT' });

    const cv = resolveChapterVersion(chapter_version);
    const { data: listed } = await supabaseServer.from('pets').select('id').eq('seller_oc', pet_merchant_oc).eq('chapter_version', cv).eq('is_preset', false).eq('is_listed', true);
    if ((listed || []).length >= 3) return res.status(400).json({ error: 'MAX_CUSTOM_PETS_REACHED' });

    const customId = `custom_${pet_merchant_oc}_${Date.now()}`;
    const { error: insertErr } = await supabaseServer.from('pets').insert({
      id: customId, name, description, is_preset: false, is_listed: true,
      price: price || 2, seller_oc: pet_merchant_oc, chapter_version: cv
    });
    if (insertErr) throw insertErr;

    res.json({ success: true, message: 'Custom pet listed successfully.', pet_id: customId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §5 黑心商人
// ============================================================
app.get('/api/npc/black-merchant/items', async (req, res) => {
  const { chapter_version } = req.query as { chapter_version?: string };
  const cv = chapter_version ? resolveChapterVersion(chapter_version) : 'ch01_v3';
  try {
    const { data: slots, error: sErr } = await supabaseServer
      .from('market_slots')
      .select('*')
      .eq('chapter_version', cv)
      .eq('is_sold', false)
      .in('seller_type', ['black_merchant', 'npc']);
    if (sErr) throw sErr;

    res.json({ items: (slots || []).map((s: any) => ({
      item_id: s.id, name: s.custom_name || s.item_id, description: s.custom_description,
      price: s.price, type: s.item_type, dice_type: s.dice_type,
      is_limited: false, remaining_stock: null
    })) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/black-merchant/buy', async (req, res) => {
  const { buyer_oc, item_id, chapter_version } = req.body;
  if (!buyer_oc || !item_id || !chapter_version) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: slot, error: sErr } = await supabaseServer
      .from('market_slots')
      .select('*')
      .eq('id', item_id)
      .eq('is_sold', false)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!slot) return res.status(404).json({ error: 'ITEM_NOT_FOUND' });

    const { data: buyer, error: bErr } = await supabaseServer
      .from('td_users')
      .select('coins')
      .eq('oc_name', buyer_oc)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!buyer) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if (((buyer as any).coins ?? 0) < (slot as any).price) return res.status(400).json({ error: 'INSUFFICIENT_COINS' });

    await supabaseServer.from('td_users').update({ coins: (buyer as any).coins - (slot as any).price }).eq('oc_name', buyer_oc);
    await supabaseServer.from('market_slots').update({ is_sold: true, buyer_oc }).eq('id', item_id);

    let effectResult = null;
    if ((slot as any).requires_dice) {
      const diceMax = (slot as any).dice_type === 'D20' ? 20 : 6;
      effectResult = `骰子結果：${Math.floor(Math.random() * diceMax) + 1}`;
    }

    res.json({ success: true, message: 'Item purchased successfully.', effect_result: effectResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/npc/black-merchant/bargain', async (req, res) => {
  const { buyer_oc, item_id, offered_price, chapter_version } = req.body;
  if (!buyer_oc || !item_id || offered_price === undefined) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: slot } = await supabaseServer.from('market_slots').select('price').eq('id', item_id).eq('is_sold', false).maybeSingle();
    if (!slot) return res.status(404).json({ error: 'ITEM_NOT_FOUND' });

    const minOffer = Math.floor((slot as any).price * 0.5);
    if (offered_price < minOffer) return res.status(400).json({ error: 'OFFER_TOO_LOW' });

    const { data: buyer } = await supabaseServer.from('td_users').select('oc_name').eq('oc_name', buyer_oc).maybeSingle();
    if (!buyer) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    // Send notification to black merchant (find by npc_role)
    const { data: merchant } = await supabaseServer.from('td_users').select('oc_name').eq('npc_role', 'black_merchant').maybeSingle();
    if (merchant) {
      await supabaseServer.from('player_notifications').insert({
        target_oc: (merchant as any).oc_name,
        content: `${buyer_oc} 對商品 ${item_id} 出價 ${offered_price} 幣（原價 ${(slot as any).price}）`,
        notification_type: 'private'
      });
    }

    res.json({ success: true, message: 'Bargain offer sent to merchant.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §6 背道者能力
// ============================================================
app.get('/api/apostate/abilities/:oc_name', async (req, res) => {
  const { oc_name } = req.params;
  const { chapter_version } = req.query as { chapter_version?: string };
  try {
    const { data: user, error: uErr } = await supabaseServer
      .from('td_users')
      .select('identity_role, apostate_skill_used, apostate_current_skill')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if ((user as any).identity_role !== 'apostate') return res.status(403).json({ error: 'NOT_AN_APOSTATE' });

    const skillUsed = (user as any).apostate_skill_used ?? false;
    const abilities = [
      { id: 'ability_A', name: '貪婪', description: '從金庫竊取一筆資金', type: 'A', is_available: !skillUsed, remaining_uses: skillUsed ? 0 : 1 },
      { id: 'ability_B', name: '陣營洩漏', description: '洩漏一個據點情報給對方陣營', type: 'B', is_available: !skillUsed, remaining_uses: skillUsed ? 0 : 1 },
      { id: 'ability_C', name: '扒竊', description: '偷取隨機玩家貨幣', type: 'C', is_available: !skillUsed, remaining_uses: skillUsed ? 0 : 1 }
    ];

    res.json({ abilities });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apostate/execute-ability', async (req, res) => {
  const { apostate_oc, ability_id, target_oc, target_landmark_id, chapter_version } = req.body;
  if (!apostate_oc || !ability_id || !chapter_version) return res.status(422).json({ error: 'MISSING_FIELDS' });
  try {
    const { data: user, error: uErr } = await supabaseServer
      .from('td_users')
      .select('identity_role, faction, apostate_skill_used')
      .eq('oc_name', apostate_oc)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    if ((user as any).identity_role !== 'apostate') return res.status(403).json({ error: 'NOT_AN_APOSTATE' });
    if ((user as any).apostate_skill_used) return res.status(400).json({ error: 'ABILITY_NOT_AVAILABLE' });

    const validAbilities = ['ability_A', 'ability_B', 'ability_C'];
    if (!validAbilities.includes(ability_id)) return res.status(404).json({ error: 'ABILITY_NOT_FOUND' });

    let message = '';
    if (ability_id === 'ability_A') {
      // Greed: steal from leader treasury
      const { data: leader } = await supabaseServer.from('td_users').select('oc_name, leader_treasury').eq('identity_role', 'leader').eq('faction', (user as any).faction).maybeSingle();
      if (!leader || (leader as any).leader_treasury === 0) {
        return res.status(400).json({ error: 'INVALID_TARGET' });
      }
      const stolen = Math.floor((leader as any).leader_treasury * 0.2) || 1;
      await supabaseServer.from('td_users').update({ leader_treasury: (leader as any).leader_treasury - stolen }).eq('oc_name', (leader as any).oc_name);
      await supabaseServer.from('td_users').update({ coins: stolen }).eq('oc_name', apostate_oc);
      message = `貪婪技能：從金庫偷取了 ${stolen} 幣`;
    } else if (ability_id === 'ability_B') {
      // Leak landmark
      if (!target_landmark_id) return res.status(400).json({ error: 'INVALID_TARGET' });
      // Determine enemy faction
      const enemyFaction = (user as any).faction === 'Turbid' ? 'Pure' : 'Turbid';
      const { error: leakErr } = await supabaseServer
        .from('td_world_map_landmarks')
        .update({ leaked_to_faction: enemyFaction, leaked_chapter: resolveChapterVersion(chapter_version) })
        .eq('id', target_landmark_id);
      if (leakErr) throw leakErr;
      message = `陣營洩漏：據點 ${target_landmark_id} 情報已洩漏`;
    } else if (ability_id === 'ability_C') {
      // Pickpocket
      const { data: candidates } = await supabaseServer.from('td_users').select('oc_name, coins').neq('oc_name', apostate_oc).eq('is_lost', false).is('npc_role', null).gt('coins', 0);
      if (!candidates || candidates.length === 0) return res.status(400).json({ error: 'INVALID_TARGET' });
      const target = candidates[Math.floor(Math.random() * candidates.length)] as any;
      const stolen = Math.max(1, Math.floor(target.coins * 0.1));
      await supabaseServer.from('td_users').update({ coins: target.coins - stolen }).eq('oc_name', target.oc_name);
      message = `扒竊技能：偷取了 ${stolen} 幣`;
    }

    await supabaseServer.from('td_users').update({ apostate_skill_used: true, apostate_current_skill: ability_id }).eq('oc_name', apostate_oc);
    res.json({ success: true, message, updated_data: { apostate_skill_used: true, apostate_current_skill: ability_id } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §7 據點留言
// ============================================================
app.post('/api/landmark/comment', async (req, res) => {
  const { oc_name, landmark_id, comment_content, chapter_version } = req.body;
  if (!oc_name || !landmark_id || !comment_content || !chapter_version) return res.status(422).json({ error: 'MISSING_FIELDS' });
  if (comment_content.length > 30) return res.status(400).json({ error: 'CONTENT_TOO_LONG' });
  try {
    const { data: user } = await supabaseServer.from('td_users').select('oc_name, faction').eq('oc_name', oc_name).maybeSingle();
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const { data: landmark } = await supabaseServer.from('td_world_map_landmarks').select('id').eq('id', landmark_id).maybeSingle();
    if (!landmark) return res.status(404).json({ error: 'LANDMARK_NOT_FOUND' });

    // Check mission completed
    const cv = resolveChapterVersion(chapter_version);
    const { data: missionLog } = await supabaseServer
      .from('mission_logs')
      .select('id')
      .eq('oc_name', oc_name)
      .eq('landmark_id', landmark_id)
      .eq('chapter_version', cv)
      .maybeSingle();
    if (!missionLog) return res.status(403).json({ error: 'MISSION_NOT_COMPLETED' });

    // Check duplicate
    const { data: existing } = await supabaseServer
      .from('landmark_messages')
      .select('id')
      .eq('landmark_id', landmark_id)
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (existing) return res.status(409).json({ error: 'ALREADY_COMMENTED' });

    const { error: insertErr } = await supabaseServer.from('landmark_messages').insert({
      landmark_id, oc_name, faction: (user as any).faction,
      content: comment_content, chapter_version: cv
    });
    if (insertErr) throw insertErr;

    res.json({ success: true, message: 'Comment submitted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/landmark/comments/:landmark_id', async (req, res) => {
  const { landmark_id } = req.params;
  const { viewer_oc } = req.query as { viewer_oc?: string };
  try {
    const { data: landmark } = await supabaseServer.from('td_world_map_landmarks').select('id').eq('id', landmark_id).maybeSingle();
    if (!landmark) return res.status(404).json({ error: 'LANDMARK_NOT_FOUND' });

    let viewerFaction: string | null = null;
    if (viewer_oc) {
      const { data: viewer } = await supabaseServer.from('td_users').select('faction').eq('oc_name', viewer_oc).maybeSingle();
      viewerFaction = viewer?.faction || null;
    }

    const { data: comments, error: cErr } = await supabaseServer
      .from('landmark_messages')
      .select('id, oc_name, faction, content, created_at')
      .eq('landmark_id', landmark_id)
      .order('created_at', { ascending: false });
    if (cErr) throw cErr;

    const filtered = viewerFaction
      ? (comments || []).filter((c: any) => c.faction === viewerFaction)
      : (comments || []);

    res.json({ comments: filtered.map((c: any) => ({
      id: c.id, oc_name: c.oc_name, faction: c.faction, content: c.content, timestamp: c.created_at
    })) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P2 §8 匿名代號
// ============================================================
app.get('/api/user/alias/:oc_name', async (req, res) => {
  const { oc_name } = req.params;
  try {
    const { data: user, error: uErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, alias_name, cursed_name_prefix, karma_tags')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const alias = (user as any).alias_name || `${oc_name.slice(0, 2)}·${Math.floor(Math.random() * 90 + 10)}號`;
    const cursedAlias = (user as any).cursed_name_prefix ? `${(user as any).cursed_name_prefix}${alias}` : alias;

    res.json({ oc_name: (user as any).oc_name, alias: cursedAlias });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P3 §1.1 褪色印記
// ============================================================
app.get('/api/user/faded-marks/:oc_name', async (req, res) => {
  const { oc_name } = req.params;
  try {
    const { data: user, error: uErr } = await supabaseServer
      .from('td_users')
      .select('oc_name, karma_tags')
      .eq('oc_name', oc_name)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    // Faded marks are karma_tags that have been replaced (stored as JSON array with timestamp field)
    const tags: any[] = (user as any).karma_tags || [];
    const fadedMarks = tags.filter((t: any) => t.faded === true);

    res.json({ oc_name: (user as any).oc_name, faded_marks: fadedMarks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P3 §2.1 天平結算
// ============================================================
app.get('/api/balance/settlement-result', async (req, res) => {
  const { chapter_version } = req.query as { chapter_version?: string };
  try {
    const { data: stats, error: sErr } = await supabaseServer
      .from('global_stats')
      .select('balance_value, updated_at')
      .eq('id', 'singleton')
      .maybeSingle();
    if (sErr) throw sErr;
    if (!stats) return res.status(404).json({ error: 'SETTLEMENT_NOT_AVAILABLE' });

    const balanceValue = (stats as any).balance_value ?? 50;
    let winningFaction: 'Turbid' | 'Pure' | 'Draw' = 'Draw';
    if (balanceValue < 50) winningFaction = 'Turbid';
    else if (balanceValue > 50) winningFaction = 'Pure';

    res.json({
      chapter_version: chapter_version || 'ch01_v3',
      final_balance_value: balanceValue,
      winning_faction: winningFaction,
      lottie_animation_data: null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P3 §3.1 遺物收集
// ============================================================
app.get('/api/user/relics/:oc_name', async (req, res) => {
  const { oc_name } = req.params;
  try {
    const { data: user } = await supabaseServer.from('td_users').select('oc_name, inventory').eq('oc_name', oc_name).maybeSingle();
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const inventory: any[] = (user as any).inventory || [];
    const relics = inventory.filter((item: any) => item.type === 'relic');

    res.json({ oc_name: (user as any).oc_name, relics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// P3 §4.1 旅店救援距離
// ============================================================
app.get('/api/inn/rescue-distance', async (req, res) => {
  try {
    res.json({ rescue_distance_settings: rescueDistanceData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`[Turbid Dust Server] Running on port ${port}`);
  console.log(`[Turbid Dust Server] API Base: http://localhost:${port}/api`);
});
