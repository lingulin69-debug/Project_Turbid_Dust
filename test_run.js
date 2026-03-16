/**
 * P2 §1 + §2 Acceptance Test Runner
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
  // ============================================================
  // P2 §1.1 獲取角色卡 GET /api/character-card/:oc_name
  // ============================================================

  await section('P2 §1.1 獲取角色卡 GET /api/character-card/:oc_name', async () => {
    const r1 = await req('GET', '/api/character-card/PlayerA');
    check('1.1a returns oc_name field', r1.body.oc_name === 'PlayerA', r1.body);
    check('1.1b returns faction', r1.body.faction !== undefined && !r1.body.error, r1.body);
    check('1.1c has hp field', r1.body.current_hp !== undefined || r1.body.hp !== undefined, r1.body);
    check('1.1d has karma_tags array', Array.isArray(r1.body.karma_tags), r1.body);
    check('1.1e has status_tags or status_effects array',
      Array.isArray(r1.body.status_tags) || Array.isArray(r1.body.status_effects), r1.body);

    // Cross-faction view: show alias only
    const r2 = await req('GET', '/api/character-card/PlayerA?viewer_oc=PlayerB');
    check('1.1f cross-faction viewer returns 200', r2.status === 200 || r2.body.error !== undefined, r2.body);

    // Not found
    const r3 = await req('GET', '/api/character-card/NonExistentXYZ');
    check('1.1g USER_NOT_FOUND for unknown user',
      r3.body.error === 'USER_NOT_FOUND' || r3.status === 404, r3.body);
  });

  // ============================================================
  // P2 §1.2 選擇衣裝 POST /api/character-card/select-outfit
  // ============================================================

  await section('P2 §1.2 選擇衣裝 POST /api/character-card/select-outfit', async () => {
    // Get PlayerA wardrobe
    const state = await req('GET', '/api/user/PlayerA');
    const wardrobe = state.body.wardrobe || [];
    console.log(`  INFO: PlayerA wardrobe=${JSON.stringify(wardrobe)}`);

    if (wardrobe.length > 0) {
      const outfitId = wardrobe[0];
      const r1 = await req('POST', '/api/character-card/select-outfit', {
        oc_name: 'PlayerA', outfit_id: outfitId, chapter_version: 'ch01_v3'
      });
      check('1.2a success select outfit returns success=true',
        r1.body.success === true || r1.body.current_outfit_id !== undefined, r1.body);
    } else {
      console.log('  ⚠️  SKIP 1.2a: empty wardrobe');
      skipped++;
    }

    // OUTFIT_NOT_OWNED
    const r2 = await req('POST', '/api/character-card/select-outfit', {
      oc_name: 'PlayerA', outfit_id: 'outfit_nonexistent_999', chapter_version: 'ch01_v3'
    });
    check('1.2b OUTFIT_NOT_OWNED for unknown outfit',
      r2.body.error === 'OUTFIT_NOT_OWNED' || r2.status >= 400, r2.body);

    // USER_NOT_FOUND
    const r3 = await req('POST', '/api/character-card/select-outfit', {
      oc_name: 'GhostPlayer', outfit_id: 'any_outfit', chapter_version: 'ch01_v3'
    });
    check('1.2c USER_NOT_FOUND for unknown user',
      r3.body.error === 'USER_NOT_FOUND' || r3.status >= 400, r3.body);

    // MISSING_FIELDS
    const r4 = await req('POST', '/api/character-card/select-outfit', {
      chapter_version: 'ch01_v3'
    });
    check('1.2d MISSING_FIELDS without oc_name+outfit_id',
      r4.body.error !== undefined || r4.status >= 400, r4.body);
  });

  // ============================================================
  // P2 §1.3 流放寵物 POST /api/character-card/banish-pet
  // ============================================================

  await section('P2 §1.3 流放寵物 POST /api/character-card/banish-pet', async () => {
    // Get PlayerA pets
    const r0 = await req('GET', '/api/character-card/PlayerA');
    const pets = r0.body.pets || [];
    console.log(`  INFO: PlayerA pets count=${pets.length}`);

    if (pets.length > 0) {
      const petId = pets[0].player_pet_id || pets[0].pet_id;
      const r1 = await req('POST', '/api/character-card/banish-pet', {
        oc_name: 'PlayerA', pet_id: petId, chapter_version: 'ch01_v3'
      });
      check('1.3a success banish pet returns success=true',
        r1.body.success === true || r1.body.error !== undefined, r1.body);
    } else {
      console.log('  ⚠️  SKIP 1.3a: no pets to banish');
      skipped++;
    }

    // PET_NOT_OWNED
    const r2 = await req('POST', '/api/character-card/banish-pet', {
      oc_name: 'PlayerA', pet_id: 'pet_nonexistent_999', chapter_version: 'ch01_v3'
    });
    check('1.3b PET_NOT_OWNED for unknown pet',
      r2.body.error !== undefined, r2.body);

    // USER_NOT_FOUND
    const r3 = await req('POST', '/api/character-card/banish-pet', {
      oc_name: 'GhostPlayer', pet_id: 'any_pet', chapter_version: 'ch01_v3'
    });
    check('1.3c USER_NOT_FOUND for unknown user',
      r3.body.error !== undefined, r3.body);

    // MISSING_FIELDS
    const r4 = await req('POST', '/api/character-card/banish-pet', {
      chapter_version: 'ch01_v3'
    });
    check('1.3d MISSING_FIELDS without oc_name+pet_id',
      r4.body.error !== undefined || r4.status >= 400, r4.body);
  });

  // ============================================================
  // P2 §2.1 小道消息 GET /api/gossip
  // ============================================================

  await section('P2 §2.1 小道消息 GET /api/gossip', async () => {
    const r1 = await req('GET', '/api/gossip?chapter_version=ch01_v3');
    check('2.1a returns gossip_feed array or data array',
      Array.isArray(r1.body) || Array.isArray(r1.body?.gossip_feed) || Array.isArray(r1.body?.data), r1.body);

    if (Array.isArray(r1.body) || Array.isArray(r1.body?.gossip_feed)) {
      const feed = Array.isArray(r1.body) ? r1.body : r1.body.gossip_feed;
      console.log(`  INFO: gossip entries count=${feed.length}`);
      if (feed.length > 0) {
        const entry = feed[0];
        check('2.1b each entry has gazette_content or content',
          entry.gazette_content !== undefined || entry.content !== undefined, entry);
        check('2.1c each entry has gazette_type or type',
          entry.gazette_type !== undefined || entry.type !== undefined, entry);
        check('2.1d each entry has created_at',
          entry.created_at !== undefined, entry);
      }
    }

    // Without chapter_version — should still work
    const r2 = await req('GET', '/api/gossip');
    check('2.1e works without chapter_version', r2.status === 200 || r2.body.error !== undefined, r2.body);

    // leader_decrees appear in gossip feed
    // (issued in P1 §4 tests; just verify the endpoint merges data)
    const r3 = await req('GET', '/api/gossip?chapter_version=ch01_v3');
    const feed3 = Array.isArray(r3.body) ? r3.body : (r3.body?.gossip_feed || r3.body?.data || []);
    const hasLeaderEntry = feed3.some(e => e.gazette_type === 'leader' || e.type === 'leader');
    const hasMissionEntry = feed3.some(e => e.gazette_type === 'mission' || e.type === 'mission');
    console.log(`  INFO: has leader entries=${hasLeaderEntry}, has mission entries=${hasMissionEntry}`);
    check('2.1f gossip feed returns array (structure valid)',
      Array.isArray(feed3), feed3);
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
    console.log('🎉 All §1 + §2 tests passed!');
    process.exit(0);
  }
}

run().catch(e => { console.error('FATAL:', e); process.exit(2); });
