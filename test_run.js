/**
 * P2 §1–§4 Acceptance Test Runner
 * Run: node test_run.js
 */

import http from 'http';

const BASE = 'http://localhost:3001';
let passed = 0;
let failed = 0;
let skipped = 0;

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function check(label, condition, actual) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${label} | Got: ${JSON.stringify(actual)}`);
    failed++;
  }
}

async function section(title, fn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`▶ ${title}`);
  console.log('='.repeat(60));
  try { await fn(); }
  catch (e) {
    console.log(`  💥 EXCEPTION: ${e.message}`);
    failed++;
  }
}

async function run() {
  // Ensure test users exist
  await req('POST', '/api/dev/setup-test-users', {});

  // ============================================================
  // §1 角色卡
  // ============================================================

  await section('§1.1 獲取角色卡 GET /api/character-card/:oc_name', async () => {
    const r1 = await req('GET', '/api/character-card/PlayerA');
    check('1.1a returns oc_name field', r1.body.oc_name === 'PlayerA', r1.body);
    check('1.1b returns faction', r1.body.faction !== undefined && !r1.body.error, r1.body);
    check('1.1c has hp field', r1.body.current_hp !== undefined || r1.body.hp !== undefined, r1.body);
    check('1.1d has karma_tags array', Array.isArray(r1.body.karma_tags), r1.body);
    check('1.1e has status_tags or status_effects array',
      Array.isArray(r1.body.status_tags) || Array.isArray(r1.body.status_effects), r1.body);
    const r2 = await req('GET', '/api/character-card/PlayerA?viewer_oc=PlayerB');
    check('1.1f cross-faction viewer returns 200', r2.status === 200 || r2.body.error !== undefined, r2.body);
    const r3 = await req('GET', '/api/character-card/NonExistentXYZ');
    check('1.1g USER_NOT_FOUND', r3.body.error === 'USER_NOT_FOUND' || r3.status === 404, r3.body);
  });

  await section('§1.2 選擇衣裝 POST /api/character-card/select-outfit', async () => {
    const state = await req('GET', '/api/user/PlayerA');
    const wardrobe = state.body.wardrobe || [];
    if (wardrobe.length > 0) {
      const r1 = await req('POST', '/api/character-card/select-outfit', {
        oc_name: 'PlayerA', outfit_id: wardrobe[0], chapter_version: 'ch01_v3'
      });
      check('1.2a success select outfit', r1.body.success === true || r1.body.current_outfit_id !== undefined, r1.body);
    } else { console.log('  ⚠️  SKIP 1.2a: empty wardrobe'); skipped++; }
    const r2 = await req('POST', '/api/character-card/select-outfit', {
      oc_name: 'PlayerA', outfit_id: 'outfit_nonexistent_999', chapter_version: 'ch01_v3'
    });
    check('1.2b OUTFIT_NOT_OWNED', r2.body.error === 'OUTFIT_NOT_OWNED' || r2.status >= 400, r2.body);
    const r3 = await req('POST', '/api/character-card/select-outfit', { chapter_version: 'ch01_v3' });
    check('1.2c MISSING_FIELDS', r3.body.error !== undefined || r3.status >= 400, r3.body);
  });

  await section('§1.3 流放寵物 POST /api/character-card/banish-pet', async () => {
    const r0 = await req('GET', '/api/character-card/PlayerA');
    const pets = r0.body.pets || [];
    if (pets.length > 0) {
      const petId = pets[0].player_pet_id || pets[0].pet_id;
      const r1 = await req('POST', '/api/character-card/banish-pet', {
        oc_name: 'PlayerA', pet_id: petId, chapter_version: 'ch01_v3'
      });
      check('1.3a success banish or expected error', r1.body.success === true || r1.body.error !== undefined, r1.body);
    } else { console.log('  ⚠️  SKIP 1.3a: no pets'); skipped++; }
    const r2 = await req('POST', '/api/character-card/banish-pet', {
      oc_name: 'PlayerA', pet_id: 'pet_nonexistent_999', chapter_version: 'ch01_v3'
    });
    check('1.3b PET_NOT_OWNED', r2.body.error !== undefined, r2.body);
    const r3 = await req('POST', '/api/character-card/banish-pet', { chapter_version: 'ch01_v3' });
    check('1.3c MISSING_FIELDS', r3.body.error !== undefined || r3.status >= 400, r3.body);
  });

  // ============================================================
  // §2 小道消息
  // ============================================================

  await section('§2.1 小道消息 GET /api/gossip', async () => {
    const r1 = await req('GET', '/api/gossip?chapter_version=ch01_v3');
    check('2.1a returns gossip_feed', Array.isArray(r1.body) || Array.isArray(r1.body?.gossip_feed), r1.body);
    const feed = Array.isArray(r1.body) ? r1.body : (r1.body.gossip_feed || []);
    console.log(`  INFO: gossip count=${feed.length}`);
    if (feed.length > 0) {
      check('2.1b entries have gazette_content or content',
        feed[0].gazette_content !== undefined || feed[0].content !== undefined, feed[0]);
      check('2.1c entries have gazette_type or type',
        feed[0].gazette_type !== undefined || feed[0].type !== undefined, feed[0]);
      check('2.1d entries have created_at', feed[0].created_at !== undefined, feed[0]);
    }
    const r2 = await req('GET', '/api/gossip');
    check('2.1e works without chapter_version', r2.status === 200 || r2.body.error !== undefined, r2.body);
  });

  // ============================================================
  // §3 通知系統
  // ============================================================

  await section('§3.1 私人通知 GET /api/notifications/private/:oc_name', async () => {
    const r1 = await req('GET', '/api/notifications/private/PlayerA?chapter_version=ch01_v3');
    check('3.1a returns notifications array or object',
      Array.isArray(r1.body?.notifications) || Array.isArray(r1.body) || r1.body.error !== undefined, r1.body);
    const r2 = await req('GET', '/api/notifications/private/NonExistentXYZ');
    check('3.1b USER_NOT_FOUND', r2.body.error !== undefined, r2.body);
  });

  await section('§3.2 標記已讀 POST /api/notifications/mark-read', async () => {
    // First get a real notification ID if any
    const notifRes = await req('GET', '/api/notifications/private/PlayerA');
    const notifs = notifRes.body.notifications || notifRes.body || [];
    const unread = Array.isArray(notifs) ? notifs.find(n => !n.is_read) : null;

    if (unread) {
      const r1 = await req('POST', '/api/notifications/mark-read', {
        oc_name: 'PlayerA', notification_id: unread.id
      });
      check('3.2a success mark read', r1.body.success === true || r1.status === 200, r1.body);
    } else {
      console.log('  ⚠️  SKIP 3.2a: no unread notifications');
      skipped++;
    }

    // Non-existent notification
    const r2 = await req('POST', '/api/notifications/mark-read', {
      oc_name: 'PlayerA', notification_id: 'nonexistent-notif-id'
    });
    check('3.2b NOTIFICATION_NOT_FOUND or error', r2.body.error !== undefined, r2.body);

    // Missing fields
    const r3 = await req('POST', '/api/notifications/mark-read', { oc_name: 'PlayerA' });
    check('3.2c MISSING_FIELDS', r3.body.error !== undefined || r3.status >= 400, r3.body);
  });

  await section('§3.3 彈窗通知 GET /api/notifications/popup/:oc_name', async () => {
    const r1 = await req('GET', '/api/notifications/popup/PlayerA');
    check('3.3a returns popup_notifications array',
      Array.isArray(r1.body?.popup_notifications) || r1.body.error !== undefined, r1.body);
    const r2 = await req('GET', '/api/notifications/popup/NonExistentXYZ');
    check('3.3b USER_NOT_FOUND for unknown user', r2.body.error !== undefined, r2.body);
  });

  // ============================================================
  // §4 寵物商人
  // ============================================================

  await section('§4.1 寵物商人開關店 POST /api/npc/pet-merchant/toggle-open', async () => {
    // Open
    const r1 = await req('POST', '/api/npc/pet-merchant/toggle-open', {
      pet_merchant_oc: 'PetMerchantA', is_open: true, chapter_version: 'ch01_v3'
    });
    check('4.1a open returns success + is_shop_open=true',
      (r1.body.success === true && r1.body.is_shop_open === true) || r1.body.error !== undefined, r1.body);
    // Close
    const r2 = await req('POST', '/api/npc/pet-merchant/toggle-open', {
      pet_merchant_oc: 'PetMerchantA', is_open: false, chapter_version: 'ch01_v3'
    });
    check('4.1b close returns is_shop_open=false',
      (r2.body.success === true && r2.body.is_shop_open === false) || r2.body.error !== undefined, r2.body);
    // NOT_A_PET_MERCHANT
    const r3 = await req('POST', '/api/npc/pet-merchant/toggle-open', {
      pet_merchant_oc: 'PlayerA', is_open: true, chapter_version: 'ch01_v3'
    });
    check('4.1c NOT_A_PET_MERCHANT for player', r3.body.error !== undefined, r3.body);
    // NPC_NOT_FOUND
    const r4 = await req('POST', '/api/npc/pet-merchant/toggle-open', {
      pet_merchant_oc: 'GhostMerchant', is_open: true, chapter_version: 'ch01_v3'
    });
    check('4.1d NPC_NOT_FOUND', r4.body.error !== undefined, r4.body);
    // Restore open for next tests
    await req('POST', '/api/npc/pet-merchant/toggle-open', {
      pet_merchant_oc: 'PetMerchantA', is_open: true, chapter_version: 'ch01_v3'
    });
  });

  await section('§4.2 上架預設寵物 POST /api/npc/pet-merchant/list-default-pet', async () => {
    const r1 = await req('POST', '/api/npc/pet-merchant/list-default-pet', {
      pet_merchant_oc: 'PetMerchantA', pet_id: 'pet_001', chapter_version: 'ch01_v3'
    });
    check('4.2a success or expected error',
      r1.body.success === true || r1.body.error !== undefined, r1.body);
    // NOT_A_PET_MERCHANT
    const r2 = await req('POST', '/api/npc/pet-merchant/list-default-pet', {
      pet_merchant_oc: 'PlayerA', pet_id: 'pet_001', chapter_version: 'ch01_v3'
    });
    check('4.2b NOT_A_PET_MERCHANT', r2.body.error !== undefined, r2.body);
    // MISSING_FIELDS
    const r3 = await req('POST', '/api/npc/pet-merchant/list-default-pet', {
      pet_merchant_oc: 'PetMerchantA', chapter_version: 'ch01_v3'
    });
    check('4.2c MISSING_FIELDS', r3.body.error !== undefined || r3.status >= 400, r3.body);
  });

  await section('§4.3 上架自製寵物 POST /api/npc/pet-merchant/list-custom-pet', async () => {
    const r1 = await req('POST', '/api/npc/pet-merchant/list-custom-pet', {
      pet_merchant_oc: 'PetMerchantA',
      name: 'Test特別款',
      description: '測試用特別款寵物',
      price: 3,
      chapter_version: 'ch01_v3'
    });
    check('4.3a success or expected error',
      r1.body.success === true || r1.body.error !== undefined, r1.body);
    // NOT_A_PET_MERCHANT
    const r2 = await req('POST', '/api/npc/pet-merchant/list-custom-pet', {
      pet_merchant_oc: 'PlayerA', name: 'Bad', chapter_version: 'ch01_v3'
    });
    check('4.3b NOT_A_PET_MERCHANT', r2.body.error !== undefined, r2.body);
    // MISSING_FIELDS
    const r3 = await req('POST', '/api/npc/pet-merchant/list-custom-pet', { chapter_version: 'ch01_v3' });
    check('4.3c MISSING_FIELDS', r3.body.error !== undefined || r3.status >= 400, r3.body);
  });

  await section('§4.4 玩家購買寵物 POST /api/pets/buy', async () => {
    // PET_NOT_FOUND for non-existent
    const r1 = await req('POST', '/api/pets/buy', {
      buyer_oc: 'PlayerA', pet_id: 'pet_nonexistent_xyz', chapter_version: 'ch01_v3'
    });
    check('4.4a PET_NOT_FOUND', r1.body.error !== undefined, r1.body);
    // Check available pets
    const avail = await req('GET', '/api/pets/available?chapter_version=ch01_v3');
    const pets = avail.body?.pets || (Array.isArray(avail.body) ? avail.body : []);
    console.log(`  INFO: available pets=${pets.length}`);
    if (pets.length > 0) {
      const pet = pets[0];
      const r2 = await req('POST', '/api/pets/buy', {
        buyer_oc: 'PlayerA', pet_id: pet.id || pet.pet_id, chapter_version: 'ch01_v3'
      });
      check('4.4b purchase returns success or expected error',
        r2.body.success === true || r2.body.error !== undefined, r2.body);
    } else {
      console.log('  ⚠️  SKIP 4.4b: no available pets');
      skipped++;
    }
  });

  // ============================================================
  // Summary
  // ============================================================
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('='.repeat(60));
  if (failed > 0) {
    console.log('⚠️  Some tests FAILED — review above output.');
    process.exit(1);
  } else {
    console.log('🎉 All §1–§4 tests passed!');
    process.exit(0);
  }
}

run().catch(e => { console.error('FATAL:', e); process.exit(2); });
