import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const { PrismaClient } = pkg;

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db'
});

const prisma = new PrismaClient({ adapter });
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- Routes ---

// 1. Get Stats (Admin)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const candidates = await prisma.td_users.findMany({
      where: {
        is_high_affinity_candidate: true,
        identity_role: 'citizen',
        // is_in_lottery_pool: true // Note: is_in_lottery_pool not in prisma schema yet, assuming implicit or all high_affinity are in pool
      }
    });

    const apostatesCh1 = await prisma.td_users.findMany({
      where: { identity_role: 'apostate_ch1' }
    });

    const apostatesCh3 = await prisma.td_users.findMany({
      where: { identity_role: 'apostate_ch3' }
    });

    const liquidators = await prisma.td_users.findMany({
      where: { identity_role: 'liquidator' }
    });

    res.json({
      candidates: {
        turbid: candidates.filter(u => u.faction === 'Turbid').length,
        pure: candidates.filter(u => u.faction === 'Pure').length
      },
      apostatesCh1: {
        turbid: apostatesCh1.filter(u => u.faction === 'Turbid').length,
        pure: apostatesCh1.filter(u => u.faction === 'Pure').length
      },
      apostatesCh3: {
        turbid: apostatesCh3.filter(u => u.faction === 'Turbid').length,
        pure: apostatesCh3.filter(u => u.faction === 'Pure').length
      },
      liquidators: {
        turbid: liquidators.filter(u => u.faction === 'Turbid').length,
        pure: liquidators.filter(u => u.faction === 'Pure').length
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Run Apostate Lottery (Admin)
app.post('/api/admin/lottery', async (req, res) => {
  const { countPerFaction, chapter } = req.body;
  
  try {
    // [Reset Identity] Clear previous roles if needed (Optional: usually handled manually, but requested to ensure correctness)
    // For now, we assume this is additive or specific per chapter. 
    // Wait, user asked to "Clear current database's wrong identity distribution".
    // Let's add a reset flag or separate endpoint? 
    // Or just do it here if it's "Chapter 1" which implies a fresh start?
    // User said: "UI 數據重置：修正後，請清空目前資料庫中錯誤的身分分配（Reset Identity），讓我們重新進行正確的章節選拔。"
    // I'll add a Reset Logic block at the start of Chapter 1.

    if (chapter === 'Chapter 1') {
      // Hard Reset: Ensure all users with numeric or invalid roles are reset to citizen
      await prisma.td_users.updateMany({
        where: { 
          identity_role: { in: ['apostate', 'apostate_ch1', 'apostate_ch3', 'liquidator', '4', '5'] } 
        },
        data: { identity_role: 'citizen' }
      });
    }

    const candidates = await prisma.td_users.findMany({
      where: {
        is_high_affinity_candidate: true,
        identity_role: 'citizen'
      }
    });

    let allSelected: any[] = [];
    let newRole = '';

    const selectRandom = (arr: any[], n: number) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n);
    };

    const turbidCandidates = candidates.filter(u => u.faction === 'Turbid');
    const pureCandidates = candidates.filter(u => u.faction === 'Pure');

    if (chapter === 'Chapter 1') {
      // Rule: 3 per faction (Total 6)
      const selectedTurbid = selectRandom(turbidCandidates, 3);
      const selectedPure = selectRandom(pureCandidates, 3);
      allSelected = [...selectedTurbid, ...selectedPure];
      newRole = 'apostate_ch1';

    } else if (chapter === 'Chapter 3') {
      // Rule: 1 per faction (Total 2) - Symmetric Awakening
      const selectedTurbid = selectRandom(turbidCandidates, 1);
      const selectedPure = selectRandom(pureCandidates, 1);
      allSelected = [...selectedTurbid, ...selectedPure];
      newRole = 'apostate_ch3';
    }

    const selectedIds = allSelected.map(u => u.id);

    if (selectedIds.length > 0) {
      await prisma.td_users.updateMany({
        where: { id: { in: selectedIds } },
        data: { identity_role: newRole }
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

// 4. Liquidator Scan
app.post('/api/liquidator/scan', async (req, res) => {
  const { targetUid, requesterFaction } = req.body; // requesterFaction for security check

  try {
    const target = await prisma.td_users.findFirst({
      where: { username: targetUid }
    });

    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }

    if (target.faction !== requesterFaction) {
      return res.status(403).json({ error: 'Cannot scan different faction' });
    }

    res.json({
      result: target.identity_role === 'apostate' ? 'positive' : 'negative'
    });

    // TODO: Log to liquidator_actions (Need to add table to prisma schema first if we want to log)

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get User Info (Login/Sync)
app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;
  try {
    let user = await prisma.td_users.findUnique({
      where: { username }
    });

    // Auto-create if not exists (for dev convenience, like previous behavior might have implied or to ensure we have data)
    // Actually, let's just return null if not found, or maybe create?
    // The previous `td_users` SQL had auto-creation logic? No.
    // Let's just return user.
    
    if (!user) {
       // Optional: Create a default user for testing
       // user = await prisma.td_users.create({
       //   data: { username, faction: 'Turbid' } // Default faction?
       // });
       return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
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

// Start Server
app.listen(port, () => {
});
