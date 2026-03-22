System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, EventTarget, PTD_DataManagerClass, _crd, SUPABASE_CONFIG, HEADERS, DATA_EVENTS, DataEventBus, DataManager;

  function _reportPossibleCrUseOfFactionType(extras) {
    _reporterNs.report("FactionType", "./PTD_UI_Theme", _context.meta, extras);
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

      _cclegacy._RF.push({}, "f0a56Vj4ltN+ZGVNsZARol6", "PTD_DataManager", undefined);

      __checkObsolete__(['EventTarget', 'sys']);

      // ── Supabase 連線設定（請在此填入妳的專案資訊） ────────────────────────────────
      SUPABASE_CONFIG = {
        URL: 'https://你的專案.supabase.co',
        KEY: 'YOUR_ANON_KEY'
      };
      HEADERS = {
        'apikey': SUPABASE_CONFIG.KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.KEY}`,
        'Content-Type': 'application/json'
      }; // ── 介面定義 ──────────────────────────────────────────────────────────────────

      _export("DATA_EVENTS", DATA_EVENTS = {
        COINS_CHANGED: 'ptd:coins-changed',
        HP_CHANGED: 'ptd:hp-changed'
      });

      _export("DataEventBus", DataEventBus = new EventTarget()); // ── DataManager 實作 ─────────────────────────────────────────────────────────


      PTD_DataManagerClass = class PTD_DataManagerClass {
        constructor() {
          this._player = null;
          this._token = null;
        }

        initPlayer(data) {
          this._player = { ...data
          };
        }

        getPlayer() {
          return this._player;
        } // ── 登入與權限 API ────────────────────────────────────────────────────────

        /** 向 Supabase 驗證帳密 (直接查詢資料表模式) */


        async login(ocName, password) {
          const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_users?oc_name=eq.${ocName}&select=*`;
          const response = await fetch(url, {
            headers: HEADERS
          });
          if (!response.ok) throw new Error(`網路請求失敗: ${response.status}`);
          const users = await response.json();
          if (!users || users.length === 0) throw new Error('找不到該 OC 名稱');
          const user = users[0];
          if (user.simple_password !== password) throw new Error('密碼錯誤');
          return user;
        }
        /** 更新密碼 */


        async updatePassword(userId, newPassword) {
          const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_users?id=eq.${userId}`;
          const response = await fetch(url, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({
              simple_password: newPassword
            })
          });
          if (!response.ok) throw new Error('更新密碼失敗');
        } // ── 遊戲狀態 API ──────────────────────────────────────────────────────────


        async fetchGameState() {
          try {
            const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/td_game_state?id=eq.1`, {
              headers: HEADERS
            });
            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
          } catch (err) {
            return null;
          }
        }

        async fetchChapterStory(chapterNumber) {
          try {
            const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/td_chapter_stories?chapter_number=eq.${chapterNumber}`, {
              headers: HEADERS
            });
            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
          } catch (err) {
            return null;
          }
        } // ── 貨幣與 HP 操作 ────────────────────────────────────────────────────────


        updateCoins(amount) {
          if (!this._player) return;
          this._player.coins = Math.max(0, this._player.coins + amount);
          DataEventBus.emit(DATA_EVENTS.COINS_CHANGED, this._player.coins);
        }

        updateHP(amount) {
          if (!this._player) return;
          this._player.hp = Math.min(this._player.max_hp, Math.max(0, this._player.hp + amount));
          DataEventBus.emit(DATA_EVENTS.HP_CHANGED, this._player.hp);
        }

      };

      _export("DataManager", DataManager = new PTD_DataManagerClass());

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=568395cde56403f55028ebb7d920a6f3fb4b4959.js.map