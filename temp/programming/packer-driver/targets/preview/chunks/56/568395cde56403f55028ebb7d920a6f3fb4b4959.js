System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, EventTarget, PTD_DataManagerClass, _crd, SUPABASE_CONFIG, HEADERS, DATA_EVENTS, DataEventBus, DataManager;

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

  function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

  function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

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
        'Authorization': "Bearer " + SUPABASE_CONFIG.KEY,
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
          this._player = _extends({}, data);
        }

        getPlayer() {
          return this._player;
        } // ── 登入與權限 API ────────────────────────────────────────────────────────

        /** 向 Supabase 驗證帳密 (直接查詢資料表模式) */


        login(ocName, password) {
          return _asyncToGenerator(function* () {
            var url = SUPABASE_CONFIG.URL + "/rest/v1/td_users?oc_name=eq." + ocName + "&select=*";
            var response = yield fetch(url, {
              headers: HEADERS
            });
            if (!response.ok) throw new Error("\u7DB2\u8DEF\u8ACB\u6C42\u5931\u6557: " + response.status);
            var users = yield response.json();
            if (!users || users.length === 0) throw new Error('找不到該 OC 名稱');
            var user = users[0];
            if (user.simple_password !== password) throw new Error('密碼錯誤');
            return user;
          })();
        }
        /** 更新密碼 */


        updatePassword(userId, newPassword) {
          return _asyncToGenerator(function* () {
            var url = SUPABASE_CONFIG.URL + "/rest/v1/td_users?id=eq." + userId;
            var response = yield fetch(url, {
              method: 'PATCH',
              headers: HEADERS,
              body: JSON.stringify({
                simple_password: newPassword
              })
            });
            if (!response.ok) throw new Error('更新密碼失敗');
          })();
        } // ── 遊戲狀態 API ──────────────────────────────────────────────────────────


        fetchGameState() {
          return _asyncToGenerator(function* () {
            try {
              var response = yield fetch(SUPABASE_CONFIG.URL + "/rest/v1/td_game_state?id=eq.1", {
                headers: HEADERS
              });
              var data = yield response.json();
              return data && data.length > 0 ? data[0] : null;
            } catch (err) {
              return null;
            }
          })();
        }

        fetchChapterStory(chapterNumber) {
          return _asyncToGenerator(function* () {
            try {
              var response = yield fetch(SUPABASE_CONFIG.URL + "/rest/v1/td_chapter_stories?chapter_number=eq." + chapterNumber, {
                headers: HEADERS
              });
              var data = yield response.json();
              return data && data.length > 0 ? data[0] : null;
            } catch (err) {
              return null;
            }
          })();
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