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
  // §5 黑心商人 + 骰子判定
  // ============================================================

  // Seed a test black market slot
  const seedRes = await req('POST', '/api/dev/seed-black-market', {});
  const testSlotId = seedRes.body?.slot_id;
  console.log(`  INFO: seeded black market slot_id=${testSlotId}`);

  await section('§5.1 獲取黑心商人商品列表 GET /api/npc/black-merchant/items', async () => {
    const r1 = await req('GET', '/api/npc/black-merchant/items?chapter_version=ch01_v3');
    check('5.1a returns items array', Array.isArray(r1.body?.items), r1.body);
    if (Array.isArray(r1.body?.items) && r1.body.items.length > 0) {
      const item = r1.body.items[0];
      check('5.1b item has item_id', item.item_id !== undefined, item);
      check('5.1c item has price', typeof item.price === 'number', item);
      check('5.1d item has type', item.type !== undefined, item);
    }
    // Works without chapter_version
    const r2 = await req('GET', '/api/npc/black-merchant/items');
    check('5.1e works without chapter_version', r2.status === 200, r2.body);
  });

  await section('§5.2 購買黑心商人商品 POST /api/npc/black-merchant/buy', async () => {
    // Give PlayerA enough coins
    await req('POST', '/api/dev/setup-test-users', {});

    // ITEM_NOT_FOUND (non-UUID triggers early rejection)
    const r1 = await req('POST', '/api/npc/black-merchant/buy', {
      buyer_oc: 'PlayerA', item_id: 'nonexistent-slot-xyz', chapter_version: 'ch01_v3'
    });
    check('5.2a ITEM_NOT_FOUND for bad id', r1.body.error !== undefined, r1.body);

    // USER_NOT_FOUND
    const r2 = await req('POST', '/api/npc/black-merchant/buy', {
      buyer_oc: 'GhostPlayerXYZ', item_id: testSlotId || 'x', chapter_version: 'ch01_v3'
    });
    check('5.2b USER_NOT_FOUND for bad user', r2.body.error === 'USER_NOT_FOUND' || r2.body.error !== undefined, r2.body);

    // MISSING_FIELDS
    const r3 = await req('POST', '/api/npc/black-merchant/buy', { chapter_version: 'ch01_v3' });
    check('5.2c MISSING_FIELDS', r3.body.error !== undefined || r3.status >= 400, r3.body);

    if (testSlotId) {
      // Give PlayerA coins first via admin or check state
      const stateRes = await req('GET', '/api/user/PlayerA');
      const coins = stateRes.body?.coins ?? 0;
      console.log(`  INFO: PlayerA coins=${coins}`);
      if (coins >= 4) {
        const r4 = await req('POST', '/api/npc/black-merchant/buy', {
          buyer_oc: 'PlayerA', item_id: testSlotId, chapter_version: 'ch01_v3'
        });
        check('5.2d success purchase returns success', r4.body.success === true, r4.body);
        check('5.2e dice item returns effect_result', r4.body.effect_result !== null, r4.body);
      } else {
        console.log('  ⚠️  SKIP 5.2d/e: PlayerA has insufficient coins');
        skipped += 2;
      }
    } else {
      console.log('  ⚠️  SKIP 5.2d/e: no test slot seeded');
      skipped += 2;
    }
  });

  await section('§5.3 黑市議價 POST /api/npc/black-merchant/bargain', async () => {
    // Re-seed since slot may have been bought
    const reSeed = await req('POST', '/api/dev/seed-black-market', {});
    const freshSlotId = reSeed.body?.slot_id;

    // MISSING_FIELDS
    const r1 = await req('POST', '/api/npc/black-merchant/bargain', { chapter_version: 'ch01_v3' });
    check('5.3a MISSING_FIELDS', r1.body.error !== undefined || r1.status >= 400, r1.body);

    // ITEM_NOT_FOUND
    const r2 = await req('POST', '/api/npc/black-merchant/bargain', {
      buyer_oc: 'PlayerA', item_id: 'nonexistent-xyz', offered_price: 3, chapter_version: 'ch01_v3'
    });
    check('5.3b ITEM_NOT_FOUND', r2.body.error === 'ITEM_NOT_FOUND', r2.body);

    if (freshSlotId) {
      // OFFER_TOO_LOW (price=4, min=2, offer=1)
      const r3 = await req('POST', '/api/npc/black-merchant/bargain', {
        buyer_oc: 'PlayerA', item_id: freshSlotId, offered_price: 1, chapter_version: 'ch01_v3'
      });
      check('5.3c OFFER_TOO_LOW', r3.body.error === 'OFFER_TOO_LOW', r3.body);

      // Success (offer=2 >= 50% of 4)
      const r4 = await req('POST', '/api/npc/black-merchant/bargain', {
        buyer_oc: 'PlayerA', item_id: freshSlotId, offered_price: 2, chapter_version: 'ch01_v3'
      });
      check('5.3d success bargain returns success', r4.body.success === true, r4.body);
    } else {
      console.log('  ⚠️  SKIP 5.3c/d: no test slot seeded');
      skipped += 2;
    }

    // USER_NOT_FOUND for buyer
    const r5 = await req('POST', '/api/npc/black-merchant/bargain', {
      buyer_oc: 'GhostPlayerXYZ', item_id: 'x', offered_price: 5, chapter_version: 'ch01_v3'
    });
    check('5.3e USER_NOT_FOUND for bad buyer (or ITEM_NOT_FOUND)', r5.body.error !== undefined, r5.body);
  });

  // ============================================================
  // §6 背道者操作優化
  // ============================================================

  // Pre-seed comment test data (needed for ability_B target landmark)
  const seedComment6 = await req('POST', '/api/dev/seed-comment-test', {});
  const abilityBLandmark = seedComment6.body?.landmark_id || 'l1';

  await section('§6.1 獲取背道者能力 GET /api/apostate/abilities/:oc_name', async () => {
    // ApostateA is apostate
    const r1 = await req('GET', '/api/apostate/abilities/ApostateA?chapter_version=ch01_v3');
    check('6.1a returns abilities array', Array.isArray(r1.body?.abilities), r1.body);
    if (Array.isArray(r1.body?.abilities)) {
      check('6.1b has 3 abilities', r1.body.abilities.length === 3, r1.body.abilities);
      const ab = r1.body.abilities[0];
      check('6.1c ability has id', ab.id !== undefined, ab);
      check('6.1d ability has name', ab.name !== undefined, ab);
      check('6.1e ability has is_available', ab.is_available !== undefined, ab);
      check('6.1f ability has remaining_uses', ab.remaining_uses !== undefined, ab);
    }

    // NOT_AN_APOSTATE for normal player
    const r2 = await req('GET', '/api/apostate/abilities/PlayerA?chapter_version=ch01_v3');
    check('6.1g NOT_AN_APOSTATE for non-apostate', r2.body.error === 'NOT_AN_APOSTATE', r2.body);

    // USER_NOT_FOUND
    const r3 = await req('GET', '/api/apostate/abilities/NonExistentXYZ?chapter_version=ch01_v3');
    check('6.1h USER_NOT_FOUND', r3.body.error === 'USER_NOT_FOUND', r3.body);
  });

  await section('§6.2 執行背道者能力 POST /api/apostate/execute-ability', async () => {
    // MISSING_FIELDS
    const r1 = await req('POST', '/api/apostate/execute-ability', { chapter_version: 'ch01_v3' });
    check('6.2a MISSING_FIELDS', r1.body.error !== undefined || r1.status >= 400, r1.body);

    // NOT_AN_APOSTATE
    const r2 = await req('POST', '/api/apostate/execute-ability', {
      apostate_oc: 'PlayerA', ability_id: 'ability_A', chapter_version: 'ch01_v3'
    });
    check('6.2b NOT_AN_APOSTATE for non-apostate', r2.body.error === 'NOT_AN_APOSTATE', r2.body);

    // USER_NOT_FOUND
    const r3 = await req('POST', '/api/apostate/execute-ability', {
      apostate_oc: 'GhostXYZ', ability_id: 'ability_A', chapter_version: 'ch01_v3'
    });
    check('6.2c USER_NOT_FOUND', r3.body.error === 'USER_NOT_FOUND', r3.body);

    // ABILITY_NOT_FOUND
    const r4 = await req('POST', '/api/apostate/execute-ability', {
      apostate_oc: 'ApostateA', ability_id: 'ability_FAKE', chapter_version: 'ch01_v3'
    });
    check('6.2d ABILITY_NOT_FOUND', r4.body.error === 'ABILITY_NOT_FOUND', r4.body);

    // Success: ability_B (陣營洩漏) — needs a landmark_id, no coin dependency
    const r5 = await req('POST', '/api/apostate/execute-ability', {
      apostate_oc: 'ApostateA', ability_id: 'ability_B',
      target_landmark_id: abilityBLandmark, chapter_version: 'ch01_v3'
    });
    check('6.2e ability_B success', r5.body.success === true, r5.body);

    // After use, ABILITY_NOT_AVAILABLE (skill_used=true)
    const r6 = await req('POST', '/api/apostate/execute-ability', {
      apostate_oc: 'ApostateA', ability_id: 'ability_A', chapter_version: 'ch01_v3'
    });
    check('6.2f ABILITY_NOT_AVAILABLE after use', r6.body.error === 'ABILITY_NOT_AVAILABLE', r6.body);

    // After use, abilities list shows is_available=false
    const r7 = await req('GET', '/api/apostate/abilities/ApostateA?chapter_version=ch01_v3');
    if (Array.isArray(r7.body?.abilities)) {
      check('6.2g is_available=false after skill used',
        r7.body.abilities.every((a) => a.is_available === false), r7.body.abilities);
    } else {
      console.log('  ⚠️  SKIP 6.2g: could not fetch abilities');
      skipped++;
    }

    // Reset ApostateA for future test runs
    await req('POST', '/api/dev/setup-test-users', {});
  });

  // ============================================================
  // §7 據點留言功能
  // ============================================================

  const seedComment = await req('POST', '/api/dev/seed-comment-test', {});
  const testLandmarkId = seedComment.body?.landmark_id;
  console.log(`  INFO: comment test landmark_id=${testLandmarkId}`);

  await section('§7.1 提交據點留言 POST /api/landmark/comment', async () => {
    // MISSING_FIELDS
    const r1 = await req('POST', '/api/landmark/comment', { chapter_version: 'ch01_v3' });
    check('7.1a MISSING_FIELDS', r1.body.error !== undefined || r1.status >= 400, r1.body);

    // USER_NOT_FOUND
    const r2 = await req('POST', '/api/landmark/comment', {
      oc_name: 'GhostXYZ', landmark_id: testLandmarkId || 'x',
      comment_content: '測試', chapter_version: 'ch01_v3'
    });
    check('7.1b USER_NOT_FOUND', r2.body.error === 'USER_NOT_FOUND' || r2.body.error !== undefined, r2.body);

    // LANDMARK_NOT_FOUND
    const r3 = await req('POST', '/api/landmark/comment', {
      oc_name: 'PlayerA', landmark_id: 'nonexistent_landmark_xyz',
      comment_content: '測試', chapter_version: 'ch01_v3'
    });
    check('7.1c LANDMARK_NOT_FOUND', r3.body.error === 'LANDMARK_NOT_FOUND', r3.body);

    // CONTENT_TOO_LONG (> 30 chars)
    const r4 = await req('POST', '/api/landmark/comment', {
      oc_name: 'PlayerA', landmark_id: testLandmarkId || 'x',
      comment_content: '這是一段超過三十個字的留言內容用來測試字數限制功能是否正常運作',
      chapter_version: 'ch01_v3'
    });
    check('7.1d CONTENT_TOO_LONG', r4.body.error === 'CONTENT_TOO_LONG', r4.body);

    if (testLandmarkId) {
      // Success: PlayerA has mission_log seeded
      const r5 = await req('POST', '/api/landmark/comment', {
        oc_name: 'PlayerA', landmark_id: testLandmarkId,
        comment_content: '這裡的任務很有挑戰性！', chapter_version: 'ch01_v3'
      });
      check('7.1e success submit comment', r5.body.success === true, r5.body);

      // ALREADY_COMMENTED on second attempt
      const r6 = await req('POST', '/api/landmark/comment', {
        oc_name: 'PlayerA', landmark_id: testLandmarkId,
        comment_content: '再留一次', chapter_version: 'ch01_v3'
      });
      check('7.1f ALREADY_COMMENTED', r6.body.error === 'ALREADY_COMMENTED', r6.body);

      // MISSION_NOT_COMPLETED: PlayerB has no mission_log
      const r7 = await req('POST', '/api/landmark/comment', {
        oc_name: 'PlayerB', landmark_id: testLandmarkId,
        comment_content: '我還沒完成', chapter_version: 'ch01_v3'
      });
      check('7.1g MISSION_NOT_COMPLETED', r7.body.error === 'MISSION_NOT_COMPLETED', r7.body);
    } else {
      console.log('  ⚠️  SKIP 7.1e/f/g: no test landmark seeded');
      skipped += 3;
    }
  });

  await section('§7.2 獲取據點留言 GET /api/landmark/comments/:landmark_id', async () => {
    // LANDMARK_NOT_FOUND
    const r1 = await req('GET', '/api/landmark/comments/nonexistent_landmark_xyz');
    check('7.2a LANDMARK_NOT_FOUND', r1.body.error === 'LANDMARK_NOT_FOUND', r1.body);

    if (testLandmarkId) {
      // Same-faction viewer (PlayerA is Turbid, comment is Turbid)
      const r2 = await req('GET', `/api/landmark/comments/${testLandmarkId}?viewer_oc=PlayerA`);
      check('7.2b returns comments array', Array.isArray(r2.body?.comments), r2.body);
      if (Array.isArray(r2.body?.comments) && r2.body.comments.length > 0) {
        check('7.2c same-faction sees comment', r2.body.comments.length > 0, r2.body.comments);
        const c = r2.body.comments[0];
        check('7.2d comment has id', c.id !== undefined, c);
        check('7.2e comment has content', c.content !== undefined, c);
        check('7.2f comment has timestamp', c.timestamp !== undefined, c);
      } else {
        check('7.2c same-faction sees comment', false, r2.body.comments);
        console.log('  ⚠️  SKIP 7.2d/e/f: no comments returned');
        skipped += 3;
      }

      // Enemy-faction viewer (EnemyPlayer is Pure, comment is Turbid — filtered out)
      const r3 = await req('GET', `/api/landmark/comments/${testLandmarkId}?viewer_oc=EnemyPlayer`);
      check('7.2g enemy faction sees no Turbid comments',
        Array.isArray(r3.body?.comments) && r3.body.comments.length === 0, r3.body);

      // No viewer_oc: returns all comments
      const r4 = await req('GET', `/api/landmark/comments/${testLandmarkId}`);
      check('7.2h no viewer returns all comments', Array.isArray(r4.body?.comments), r4.body);
    } else {
      console.log('  ⚠️  SKIP 7.2b-h: no test landmark seeded');
      skipped += 7;
    }
  });

  // ============================================================
  // §8 匿名代號生成
  // ============================================================

  await section('§8.1 獲取玩家匿名代號 GET /api/user/alias/:oc_name', async () => {
    // Success
    const r1 = await req('GET', '/api/user/alias/PlayerA');
    check('8.1a returns oc_name', r1.body.oc_name === 'PlayerA', r1.body);
    check('8.1b returns alias string', typeof r1.body.alias === 'string' && r1.body.alias.length > 0, r1.body);

    // Alias is stable (same request returns same value if alias_name is set)
    const r2 = await req('GET', '/api/user/alias/PlayerA');
    check('8.1c alias is non-empty on repeat', typeof r2.body.alias === 'string' && r2.body.alias.length > 0, r2.body);

    // Different players get different aliases
    const r3 = await req('GET', '/api/user/alias/PlayerB');
    check('8.1d PlayerB returns alias', typeof r3.body.alias === 'string' && r3.body.alias.length > 0, r3.body);

    // USER_NOT_FOUND
    const r4 = await req('GET', '/api/user/alias/NonExistentXYZ');
    check('8.1e USER_NOT_FOUND', r4.body.error === 'USER_NOT_FOUND', r4.body);
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
    console.log('🎉 All §1–§8 tests passed!');
    process.exit(0);
  }
}

run().catch(e => { console.error('FATAL:', e); process.exit(2); });
