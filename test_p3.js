/**
 * P3 §1 褪色印記 — Acceptance Test
 * Run: node test_p3.js
 */

import http from 'http';

const BASE = 'http://localhost:3001';
let passed = 0;
let failed = 0;

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
  // ── 先確保測試用戶存在 ──────────────────────────────────────
  await req('POST', '/api/dev/setup-test-users', {});

  // ── 準備：注入褪色印記測試資料到 PlayerA ────────────────────
  // 使用 6 個 karma_tags 觸發褪色邏輯（addKarmaTag 第 5+ 個會自動褪色）
  // 直接透過 dev endpoint 注入已有 is_faded=true 的資料
  await req('POST', '/api/dev/inject-karma-tags', {
    oc_name: 'PlayerA',
    karma_tags: [
      { tag: '護衛本能', is_faded: true,  faded_at: '2026-03-01T00:00:00Z', description: '曾保護過他人的本能' },
      { tag: '迷失旅人', is_faded: true,  faded_at: '2026-03-05T00:00:00Z', description: '曾迷失於路途的記憶' },
      { tag: '血腥氣息', is_faded: false, description: '戰鬥後殘留的氣息' },
      { tag: '黑市常客', is_faded: false, description: '熟悉地下市場的面孔' },
      { tag: '善意謊言', is_faded: false, description: '為保護他人而說的謊' }
    ]
  });

  // ============================================================
  await section('P3 §1.1 GET /api/user/faded-marks/:oc_name — 成功', async () => {
    const r = await req('GET', '/api/user/faded-marks/PlayerA');

    check('HTTP 200', r.status === 200, r.status);
    check('回應含 oc_name', r.body.oc_name === 'PlayerA', r.body.oc_name);
    check('回應含 faded_marks 陣列', Array.isArray(r.body.faded_marks), r.body.faded_marks);
    check('faded_marks 只包含褪色標籤（is_faded=true）', r.body.faded_marks.length === 2, r.body.faded_marks.length);

    const first = r.body.faded_marks[0];
    check('每個 faded_mark 含 tag_id', first && typeof first.tag_id === 'string', first?.tag_id);
    check('每個 faded_mark 含 name', first && typeof first.name === 'string', first?.name);
    check('每個 faded_mark 含 description', first && typeof first.description === 'string', first?.description);
    check('每個 faded_mark 含 timestamp', first && typeof first.timestamp === 'string', first?.timestamp);
  });

  // ============================================================
  await section('P3 §1.1 GET /api/user/faded-marks/:oc_name — 玩家不存在', async () => {
    const r = await req('GET', '/api/user/faded-marks/NonExistentPlayer_XYZ');

    check('HTTP 404', r.status === 404, r.status);
    check('回應含 error: USER_NOT_FOUND', r.body.error === 'USER_NOT_FOUND', r.body.error);
  });

  // ============================================================
  await section('P3 §1.1 GET /api/user/faded-marks/:oc_name — 無褪色印記的玩家', async () => {
    // PlayerB 沒有褪色印記
    await req('POST', '/api/dev/inject-karma-tags', {
      oc_name: 'PlayerB',
      karma_tags: [
        { tag: '謹慎行事', is_faded: false, description: '處事謹慎的態度' }
      ]
    });

    const r = await req('GET', '/api/user/faded-marks/PlayerB');

    check('HTTP 200', r.status === 200, r.status);
    check('faded_marks 為空陣列', Array.isArray(r.body.faded_marks) && r.body.faded_marks.length === 0, r.body.faded_marks);
  });

  // ============================================================
  // P3 §2.1 GET /api/balance/settlement-result — 成功（帶 chapter_version）
  // ============================================================
  await section('P3 §2.1 GET /api/balance/settlement-result — 帶 chapter_version', async () => {
    const r = await req('GET', '/api/balance/settlement-result?chapter_version=ch01_v3');

    check('HTTP 200', r.status === 200, r.status);
    check('回應含 chapter_version', typeof r.body.chapter_version === 'string', r.body.chapter_version);
    check('回應含 final_balance_value (number)', typeof r.body.final_balance_value === 'number', r.body.final_balance_value);
    check('winning_faction 為合法值', ['Turbid', 'Pure', 'Draw'].includes(r.body.winning_faction), r.body.winning_faction);
    check('回應含 lottie_animation_data 欄位', 'lottie_animation_data' in r.body, r.body);
  });

  await section('P3 §2.1 GET /api/balance/settlement-result — 不帶 chapter_version', async () => {
    const r = await req('GET', '/api/balance/settlement-result');

    check('HTTP 200', r.status === 200, r.status);
    check('chapter_version 有預設值', typeof r.body.chapter_version === 'string' && r.body.chapter_version.length > 0, r.body.chapter_version);
    check('final_balance_value 為 0–100', r.body.final_balance_value >= 0 && r.body.final_balance_value <= 100, r.body.final_balance_value);
  });

  // ============================================================
  // P3 §3.1 GET /api/user/relics/:oc_name
  // ============================================================
  await section('P3 §3.1 GET /api/user/relics/:oc_name — 無遺物玩家', async () => {
    // PlayerB 庫存預設為空
    const r = await req('GET', '/api/user/relics/PlayerB');

    check('HTTP 200', r.status === 200, r.status);
    check('回應含 oc_name', r.body.oc_name === 'PlayerB', r.body.oc_name);
    check('relics 為陣列', Array.isArray(r.body.relics), r.body.relics);
    check('relics 為空', r.body.relics.length === 0, r.body.relics.length);
  });

  await section('P3 §3.1 GET /api/user/relics/:oc_name — 含遺物玩家', async () => {
    // 注入一個 relic 到 PlayerA 的 inventory
    await req('POST', '/api/dev/inject-inventory', {
      oc_name: 'PlayerA',
      inventory: [
        { item_id: 'relic_broken_flute', type: 'relic', acquired_at: '2026-03-10T00:00:00Z' }
      ]
    });

    const r = await req('GET', '/api/user/relics/PlayerA');

    check('HTTP 200', r.status === 200, r.status);
    check('relics 長度為 1', r.body.relics.length === 1, r.body.relics.length);
    const relic = r.body.relics[0];
    check('relic 含 relic_id', typeof relic.relic_id === 'string', relic?.relic_id);
    check('relic 含 name', typeof relic.name === 'string', relic?.name);
    check('relic 含 description', typeof relic.description === 'string', relic?.description);
    check('relic 含 image_url', 'image_url' in relic, relic);
    check('relic_id 正確', relic.relic_id === 'relic_broken_flute', relic.relic_id);
    check('name 來自 items.json', relic.name === '斷裂的木笛', relic.name);
  });

  await section('P3 §3.1 GET /api/user/relics/:oc_name — 玩家不存在', async () => {
    const r = await req('GET', '/api/user/relics/NonExistentPlayer_XYZ');

    check('HTTP 404', r.status === 404, r.status);
    check('回應含 error: USER_NOT_FOUND', r.body.error === 'USER_NOT_FOUND', r.body.error);
  });

  // ============================================================
  // P3 §4.1 GET /api/inn/rescue-distance
  // ============================================================
  await section('P3 §4.1 GET /api/inn/rescue-distance — 成功', async () => {
    const r = await req('GET', '/api/inn/rescue-distance');

    check('HTTP 200', r.status === 200, r.status);
    check('回應含 rescue_distance_settings 陣列', Array.isArray(r.body.rescue_distance_settings), r.body.rescue_distance_settings);
  });

  await section('P3 §4.1 GET /api/inn/rescue-distance — 資料結構驗證（有資料時）', async () => {
    const r = await req('GET', '/api/inn/rescue-distance');
    const settings = r.body.rescue_distance_settings;

    if (settings.length === 0) {
      console.log('  ⏭  SKIP: rescue-distance.json 尚未填入資料（空陣列為合法狀態）');
      return;
    }

    const first = settings[0];
    check('每筆含 inn_landmark_id', typeof first.inn_landmark_id === 'string', first?.inn_landmark_id);
    check('每筆含 distance_zones 陣列', Array.isArray(first.distance_zones), first?.distance_zones);

    if (first.distance_zones.length > 0) {
      const zone = first.distance_zones[0];
      check('zone 含 zone_name', typeof zone.zone_name === 'string', zone?.zone_name);
      check('zone 含 landmark_ids 陣列', Array.isArray(zone.landmark_ids), zone?.landmark_ids);
      check('zone 含 time_reduction_minutes', typeof zone.time_reduction_minutes === 'number', zone?.time_reduction_minutes);
    }
  });

  // ── 結果統計 ─────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`結果：${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
