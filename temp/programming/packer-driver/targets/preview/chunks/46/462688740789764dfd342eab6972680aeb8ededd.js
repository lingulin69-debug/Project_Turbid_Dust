System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, EventTarget, PTD_DataManagerClass, _crd, SUPABASE_CONFIG, HEADERS, DATA_EVENTS, DataEventBus, DataManager;

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

  function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

  function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

  function _reportPossibleCrUseOfFactionType(extras) {
    _reporterNs.report("FactionType", "./PTD_UI_Theme", _context.meta, extras);
  }

  function _reportPossibleCrUseOfLandmarkData(extras) {
    _reporterNs.report("LandmarkData", "./MapLandmark", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      EventTarget = _cc.EventTarget;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "07b4aeziuNIf6RE6e67LS/B", "PTD_DataManager", undefined);

      __checkObsolete__(['EventTarget']);

      // ── Supabase 連線設定（統一管理，修改時只需改這裡） ──────────────────────────
      SUPABASE_CONFIG = {
        URL: 'https://yavrjxsmxzxihjaibxek.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdnJqeHNteHp4aWhqYWlieGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDU1MDMsImV4cCI6MjA4NTg4MTUwM30.U7HQ34v6HyPdd6npY0ejzIYhdsIftQ660T8CTuycORs'
      };
      HEADERS = {
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': "Bearer " + SUPABASE_CONFIG.ANON_KEY,
        'Content-Type': 'application/json'
      }; // ── 介面定義 ──────────────────────────────────────────────────────────────────

      /** 背包道具資料 */

      /** 玩家基本資料 */

      /** 登入 API 回傳資料（含 password 用於偵測初始密碼 0000） */

      /** 天平計算所需的據點快照 */

      /** 天平計算結果 */

      /** 遊戲狀態（章節系統） */

      /** 章節劇情資料 */

      // ── 事件名稱常數 ──────────────────────────────────────────────────────────────
      _export("DATA_EVENTS", DATA_EVENTS = {
        COINS_CHANGED: 'ptd:coins-changed',
        HP_CHANGED: 'ptd:hp-changed',
        BALANCE_UPDATED: 'ptd:balance-updated'
      }); // ── 全域事件總線（單例） ──────────────────────────────────────────────────────


      _export("DataEventBus", DataEventBus = new EventTarget()); // ── DataManager 實作 ─────────────────────────────────────────────────────────


      PTD_DataManagerClass = class PTD_DataManagerClass {
        constructor() {
          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._player = null;
          this._landmarks = new Map();
          this._inventory = [];
          this._token = null;
        }

        // ── 玩家資料管理 ──────────────────────────────────────────────────────────
        initPlayer(data) {
          this._player = _extends({}, data);
        }

        getPlayer() {
          return this._player;
        } // ── 貨幣操作 ──────────────────────────────────────────────────────────────

        /**
         * 修改本地貨幣值並廣播事件。
         * @param amount 正值為增加，負值為扣除
         * @returns 修改後的貨幣值，未初始化時返回 null
         */


        updateCoins(amount) {
          if (!this._player) return null;
          this._player.coins = Math.max(0, this._player.coins + amount);
          DataEventBus.emit(DATA_EVENTS.COINS_CHANGED, this._player.coins);
          return this._player.coins;
        } // ── HP 操作 ───────────────────────────────────────────────────────────────

        /**
         * 修改本地 HP 值並廣播事件。
         * @param amount 正值為回血，負值為扣血
         * @returns 修改後的 HP，未初始化時返回 null
         */


        updateHP(amount) {
          if (!this._player) return null;
          this._player.hp = Math.min(this._player.max_hp, Math.max(0, this._player.hp + amount));
          DataEventBus.emit(DATA_EVENTS.HP_CHANGED, this._player.hp);
          return this._player.hp;
        } // ── 據點資料同步（天平計算用） ────────────────────────────────────────────

        /**
         * 從地圖的 LandmarkData 陣列更新內部快照，供天平計算使用。
         * 通常在場景初始化或 Realtime 推送後呼叫。
         */


        syncLandmarks(landmarks) {
          this._landmarks.clear();

          for (var lm of landmarks) {
            this._landmarks.set(lm.id, {
              id: lm.id,
              faction: lm.faction,
              status: lm.status,
              weight: 1 // 預設權重，特殊據點可呼叫 setLandmarkWeight() 調整

            });
          }
        }
        /**
         * 覆寫單一據點的佔領權重（用於特殊關鍵地點）。
         */


        setLandmarkWeight(id, weight) {
          var lm = this._landmarks.get(id);

          if (lm) lm.weight = weight;
        } // ── 天平計算 ──────────────────────────────────────────────────────────────

        /**
         * 統計所有 open 據點的陣營佔領情況，計算天平值。
         * 
         * 計算規則：
         *   - 只計算 status = 'open' 且 faction ≠ 'Common' 的據點
         *   - balance_value = ((pure_weight - turbid_weight) / total_weight) * 100
         *   - 結果區間：-100（全 Turbid） → 0（均勢） → +100（全 Pure）
         * 
         * ⚠️ 此函數僅計算本地快照；實際寫入資料庫須透過 API。
         */


        calculateBalance() {
          var turbidWeight = 0;
          var pureWeight = 0;

          for (var lm of this._landmarks.values()) {
            if (lm.status !== 'open') continue;
            if (lm.faction === 'Turbid') turbidWeight += lm.weight;else if (lm.faction === 'Pure') pureWeight += lm.weight;
          }

          var totalWeight = turbidWeight + pureWeight;
          var balanceValue = 0;

          if (totalWeight > 0) {
            balanceValue = (pureWeight - turbidWeight) / totalWeight * 100;
          }

          var dominant = balanceValue > 0 ? 'Pure' : balanceValue < 0 ? 'Turbid' : 'Draw';
          var result = {
            turbid_weight: turbidWeight,
            pure_weight: pureWeight,
            balance_value: balanceValue,
            dominant
          };
          DataEventBus.emit(DATA_EVENTS.BALANCE_UPDATED, result);
          return result;
        } // ── 背包資料 ──────────────────────────────────────────────────────────────

        /**
         * 取得玩家背包道具列表。
         * 正式版：從 Supabase 拉取 td_inventory 表（依 player_id 過濾）。
         * 目前回傳 Mock Data 供 UI 測試使用。
         */


        fetchInventory() {
          var _this = this;

          return _asyncToGenerator(function* () {
            // TODO：正式版替換為以下邏輯
            // const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_inventory?player_id=eq.${this._player?.id}`;
            // const response = await fetch(url, { headers: HEADERS });
            // if (!response.ok) return [];
            // this._inventory = await response.json();
            // return this._inventory;
            // ── Mock Data（8 筆測試道具） ─────────────────────────────────────────
            _this._inventory = [{
              id: 'item_001',
              name: '濁息藥劑',
              description: '恢復 20 HP，帶有濃烈苦味。',
              quantity: 3,
              type: 'consumable',
              price: 3,
              rarity: 1
            }, {
              id: 'item_002',
              name: '淨塵符咒',
              description: '短暫驅散周圍的濁氣。',
              quantity: 1,
              type: 'consumable',
              price: 5,
              rarity: 2
            }, {
              id: 'item_003',
              name: '黑市通行令',
              description: '進入黑心商人特殊貨架的憑證。',
              quantity: 1,
              type: 'key',
              price: 10,
              rarity: 3
            }, {
              id: 'item_004',
              name: '破舊地圖',
              description: '記載著某個廢棄據點的方位。',
              quantity: 1,
              type: 'material',
              price: 2,
              rarity: 1
            }, {
              id: 'item_005',
              name: '鏽蝕鎖鏈',
              description: '不知用途，也許有人想要。',
              quantity: 5,
              type: 'material',
              price: 1,
              rarity: 1
            }, {
              id: 'item_006',
              name: '陣營徽章',
              description: '證明歸屬的金屬徽章。',
              quantity: 1,
              type: 'equipment',
              price: 8,
              rarity: 2
            }, {
              id: 'item_007',
              name: '過期藥水',
              description: '已無效果，但聞起來還行。',
              quantity: 0,
              type: 'consumable',
              price: 0,
              rarity: 1
            }, {
              id: 'item_008',
              name: '白鴉羽毛',
              description: '極為罕見，據說帶有神秘力量。',
              quantity: 1,
              type: 'material',
              price: 20,
              rarity: 4
            }];
            return _this._inventory;
          })();
        }
        /**
         * 取得本地快取的背包（不發網路請求）。
         */


        getInventory() {
          return this._inventory;
        }
        /**
         * 購買道具：扣除金幣並加入背包。
         * ⚠️ 此方法只操作本地快取，實際寫入資料庫須在 Controller 層呼叫對應 API。
         * 
         * @returns success: false 若金幣不足；success: true 並附說明訊息
         */


        purchaseItem(item) {
          var player = this._player;

          if (!player) {
            return {
              success: false,
              message: '玩家資料未初始化'
            };
          }

          if (player.coins < item.price) {
            return {
              success: false,
              message: '金幣不足'
            };
          }

          this.updateCoins(-item.price); // 已有同 ID 道具則累加數量，否則新增一筆

          var existing = this._inventory.find(i => i.id === item.id);

          if (existing) {
            existing.quantity += 1;
          } else {
            this._inventory.push(_extends({}, item, {
              quantity: 1
            }));
          }

          return {
            success: true,
            message: "\u8CFC\u8CB7\u6210\u529F\uFF1A" + item.name
          };
        } // ── 遊戲狀態與章節劇情 API ────────────────────────────────────────────────


        fetchGameState() {
          return _asyncToGenerator(function* () {
            try {
              var url = SUPABASE_CONFIG.URL + "/rest/v1/td_game_state?id=eq.1";
              var response = yield fetch(url, {
                headers: HEADERS
              });
              if (!response.ok) return null;
              var data = yield response.json();
              return data && data.length > 0 ? data[0] : null;
            } catch (err) {
              console.error('[DataManager] fetchGameState 失敗', err);
              return null;
            }
          })();
        }

        fetchChapterStory(chapterNumber) {
          return _asyncToGenerator(function* () {
            try {
              var url = SUPABASE_CONFIG.URL + "/rest/v1/td_chapter_stories?chapter_number=eq." + chapterNumber;
              var response = yield fetch(url, {
                headers: HEADERS
              });
              if (!response.ok) return null;
              var data = yield response.json();
              return data && data.length > 0 ? data[0] : null;
            } catch (err) {
              console.error('[DataManager] fetchChapterStory 失敗', err);
              return null;
            }
          })();
        } // ── 登入與權限 API ────────────────────────────────────────────────────────

        /**
         * 向後端 Edge Function 驗證 OC 名稱與密碼。
         * 回傳值中含原始 password，控制層須自行判斷是否為 '0000' 並攔截流程。
         * 成功後將 token 存入內部 _token，供後續 API 呼叫使用。
         * 
         * @throws Error 登入失敗（帳號/密碼錯誤或網路異常）
         */


        login(ocName, password) {
          var _this2 = this;

          return _asyncToGenerator(function* () {
            var url = SUPABASE_CONFIG.URL + "/functions/v1/login"; // ← 確認這行

            var response = yield fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                oc_name: ocName,
                password
              })
            });

            if (!response.ok) {
              var _err$message;

              var err = yield response.json().catch(() => ({}));
              throw new Error((_err$message = err == null ? void 0 : err.message) != null ? _err$message : "\u767B\u5165\u5931\u6557\uFF08HTTP " + response.status + "\uFF09");
            }

            var data = yield response.json();
            _this2._token = data.token;
            return data;
          })();
        }
        /**
         * 更新玩家密碼。必須在 login() 成功後呼叫（需要 _token）。
         * 
         * @throws Error 若尚未登入或 API 回傳錯誤
         */


        updatePassword(newPassword) {
          var _this3 = this;

          return _asyncToGenerator(function* () {
            if (!_this3._token) {
              throw new Error('[DataManager] updatePassword：尚未登入，缺少 token');
            }

            var url = SUPABASE_CONFIG.URL + "/functions/v1/update-password"; // ← 確認這行

            var response = yield fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + _this3._token // ← 確認這行

              },
              body: JSON.stringify({
                new_password: newPassword
              }) // ← 確認這行

            });

            if (!response.ok) {
              var _err$message2;

              var err = yield response.json().catch(() => ({}));
              throw new Error((_err$message2 = err == null ? void 0 : err.message) != null ? _err$message2 : "\u6539\u5BC6\u5931\u6557\uFF08HTTP " + response.status + "\uFF09");
            }
          })();
        } // ── 重置（換章 / 登出時使用） ─────────────────────────────────────────────


        reset() {
          this._player = null;

          this._landmarks.clear();

          this._inventory = [];
          this._token = null;
        }

      }; // ── 單例匯出 ──────────────────────────────────────────────────────────────────

      _export("DataManager", DataManager = new PTD_DataManagerClass());

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=462688740789764dfd342eab6972680aeb8ededd.js.map