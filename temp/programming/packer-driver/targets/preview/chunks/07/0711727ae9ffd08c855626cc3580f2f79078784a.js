System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, Node, ProgressBar, Sprite, tween, Vec3, DataEventBus, DATA_EVENTS, DataManager, SoundManager, getPageTheme, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _crd, ccclass, property, MAX_DONATIONS_PER_WEEK, DONATION_COST, DonationTracker;

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

  function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfDataEventBus(extras) {
    _reporterNs.report("DataEventBus", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfDATA_EVENTS(extras) {
    _reporterNs.report("DATA_EVENTS", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfDataManager(extras) {
    _reporterNs.report("DataManager", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfSoundManager(extras) {
    _reporterNs.report("SoundManager", "./SoundManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfgetPageTheme(extras) {
    _reporterNs.report("getPageTheme", "./PTD_UI_Theme", _context.meta, extras);
  }

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
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Label = _cc.Label;
      Node = _cc.Node;
      ProgressBar = _cc.ProgressBar;
      Sprite = _cc.Sprite;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      DataEventBus = _unresolved_2.DataEventBus;
      DATA_EVENTS = _unresolved_2.DATA_EVENTS;
      DataManager = _unresolved_2.DataManager;
    }, function (_unresolved_3) {
      SoundManager = _unresolved_3.SoundManager;
    }, function (_unresolved_4) {
      getPageTheme = _unresolved_4.getPageTheme;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "44ae09Eu0JLh4eOGitorrS9", "DonationTracker", undefined);

      __checkObsolete__(['_decorator', 'Color', 'Component', 'Label', 'Node', 'ProgressBar', 'Sprite', 'tween', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── 常數 ──────────────────────────────────────────────────────────────────────

      MAX_DONATIONS_PER_WEEK = 10; // 每週捐獻上限

      DONATION_COST = 1; // 每次捐獻消耗金幣
      // ── 組件 ─────────────────────────────────────────────────────────────────────

      /**
       * DonationTracker
       * 
       * 捐獻追蹤器，顯示本週已捐獻次數並限制玩家捐獻。
       * 每週日 20:00 結算時自動重置（由 MainGameController 呼叫）。
       * 
       * UI 佈局建議：
       *   ┌──────────────────────┐
       *   │  本週捐獻  7/10      │
       *   │  ████████░░░         │ ← ProgressBar
       *   │  [+1 捐獻]           │ ← 捐獻按鈕
       *   └──────────────────────┘
       */

      _export("DonationTracker", DonationTracker = (_dec = ccclass('DonationTracker'), _dec2 = property(Label), _dec3 = property(ProgressBar), _dec4 = property(Node), _dec5 = property(Label), _dec6 = property(Label), _dec(_class = (_class2 = class DonationTracker extends Component {
        constructor() {
          super(...arguments);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /** 捐獻次數文字（例：7/10）*/
          _initializerDefineProperty(this, "countLabel", _descriptor, this);

          /** 進度條（視覺化捐獻進度）*/
          _initializerDefineProperty(this, "progressBar", _descriptor2, this);

          /** 捐獻按鈕 */
          _initializerDefineProperty(this, "donateButton", _descriptor3, this);

          /** 按鈕上的文字（例：「+1 捐獻」）*/
          _initializerDefineProperty(this, "donateButtonLabel", _descriptor4, this);

          /** 已達上限提示文字（初始隱藏）*/
          _initializerDefineProperty(this, "maxReachedLabel", _descriptor5, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._donationsThisWeek = 0;
          this._currentChapter = 1;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._registerEvents(); // 確保按鈕被綁定

        }

        onDestroy() {
          var _this$donateButton;

          (_this$donateButton = this.donateButton) == null || _this$donateButton.targetOff(this);
          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).off((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).COINS_CHANGED, this._onCoinsChanged, this);
        }
        /** 由主場景在確認章節後呼叫，初始化並載入資料 */


        initForChapter(chapterNumber) {
          var _this = this;

          return _asyncToGenerator(function* () {
            _this._currentChapter = chapterNumber;
            yield _this._loadDonationData();

            _this._updateDisplay();

            console.log("[DonationTracker] \u5DF2\u521D\u59CB\u5316\u7AE0\u7BC0 " + chapterNumber + " \u7684\u6350\u737B\u9032\u5EA6");
          })();
        } // ── 初始化 ────────────────────────────────────────────────────────────────

        /** 從 Supabase 拉取玩家本週捐獻次數 */


        _loadDonationData() {
          var _this2 = this;

          return _asyncToGenerator(function* () {
            try {
              var player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
                error: Error()
              }), DataManager) : DataManager).getPlayer();
              if (!player) return;
              var response = yield fetch("https://\u4F60\u7684\u5C08\u6848.supabase.co/rest/v1/td_player_donations?player_id=eq." + player.id + "&chapter_number=eq." + _this2._currentChapter, {
                headers: {
                  'apikey': 'YOUR_ANON_KEY',
                  'Authorization': 'Bearer YOUR_ANON_KEY'
                }
              });
              var data = yield response.json();

              if (data && data.length > 0) {
                _this2._donationsThisWeek = data[0].donation_count || 0;
              }
            } catch (err) {
              console.warn('[DonationTracker] 載入捐獻資料失敗', err);
            }
          })();
        }
        /** 設定主題顏色（由 HUD 或主場景呼叫）*/


        initTheme(faction) {
          var theme = (_crd && getPageTheme === void 0 ? (_reportPossibleCrUseOfgetPageTheme({
            error: Error()
          }), getPageTheme) : getPageTheme)(faction);

          if (this.countLabel) {
            this.countLabel.color = theme.textPrimary;
          }

          if (this.progressBar) {
            var _this$progressBar$nod;

            var barSprite = (_this$progressBar$nod = this.progressBar.node.getChildByName('bar')) == null ? void 0 : _this$progressBar$nod.getComponent(Sprite);

            if (barSprite) {
              barSprite.color = theme.primary;
            }
          }
        } // ── 顯示更新 ──────────────────────────────────────────────────────────────


        _updateDisplay() {
          var remaining = MAX_DONATIONS_PER_WEEK - this._donationsThisWeek;
          var isMaxed = remaining <= 0; // 次數標籤

          if (this.countLabel) {
            this.countLabel.string = this._donationsThisWeek + "/" + MAX_DONATIONS_PER_WEEK;
          } // 進度條


          if (this.progressBar) {
            var progress = this._donationsThisWeek / MAX_DONATIONS_PER_WEEK;
            tween(this.progressBar).to(0.3, {
              progress
            }).start();
          } // 按鈕狀態


          if (this.donateButton) {
            this.donateButton.active = !isMaxed;
          } // 上限提示


          if (this.maxReachedLabel) {
            this.maxReachedLabel.node.active = isMaxed;
          } // 按鈕文字（顯示剩餘次數）


          if (this.donateButtonLabel && remaining > 0) {
            this.donateButtonLabel.string = "+1 \u6350\u737B (\u5269 " + remaining + " \u6B21)";
          }
        } // ── 捐獻邏輯 ──────────────────────────────────────────────────────────────


        _onDonateClick() {
          var _this3 = this;

          return _asyncToGenerator(function* () {
            var player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
              error: Error()
            }), DataManager) : DataManager).getPlayer();
            if (!player) return; // 檢查上限

            if (_this3._donationsThisWeek >= MAX_DONATIONS_PER_WEEK) {
              console.warn('[DonationTracker] 已達本週捐獻上限');

              _this3._showMaxReachedAnimation();

              return;
            } // 檢查金幣


            if (player.coins < DONATION_COST) {
              console.warn('[DonationTracker] 金幣不足'); // TODO: 顯示金幣不足提示

              return;
            } // 按鈕動畫


            tween(_this3.donateButton).to(0.05, {
              scale: new Vec3(0.88, 0.88, 1)
            }).to(0.08, {
              scale: Vec3.ONE
            }).call( /*#__PURE__*/_asyncToGenerator(function* () {
              yield _this3._processDonation();
            })).start();
          })();
        }
        /** 執行捐獻：扣金幣、更新次數、寫入資料庫 */


        _processDonation() {
          var _this4 = this;

          return _asyncToGenerator(function* () {
            var player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
              error: Error()
            }), DataManager) : DataManager).getPlayer();
            if (!player) return;

            try {
              // 1. 扣除金幣（本地）
              (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
                error: Error()
              }), DataManager) : DataManager).updateCoins(-DONATION_COST); // 2. 增加捐獻次數

              _this4._donationsThisWeek++; // 3. 寫入資料庫

              yield fetch('https://你的專案.supabase.co/rest/v1/rpc/increment_donation', {
                method: 'POST',
                headers: {
                  'apikey': 'YOUR_ANON_KEY',
                  'Authorization': 'Bearer YOUR_ANON_KEY',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  p_player_id: player.id,
                  p_chapter_number: _this4._currentChapter
                })
              }); // 4. 更新顯示

              _this4._updateDisplay(); // 5. 音效


              (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
                error: Error()
              }), SoundManager) : SoundManager).coin();
              console.log("[DonationTracker] \u6350\u737B\u6210\u529F\uFF0C\u672C\u9031\u7B2C " + _this4._donationsThisWeek + " \u6B21");
            } catch (err) {
              console.error('[DonationTracker] 捐獻失敗', err); // 回滾本地金幣

              (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
                error: Error()
              }), DataManager) : DataManager).updateCoins(DONATION_COST);
              _this4._donationsThisWeek--;
            }
          })();
        } // ── 動畫效果 ──────────────────────────────────────────────────────────────


        _showMaxReachedAnimation() {
          if (!this.maxReachedLabel) return;
          this.maxReachedLabel.node.active = true;
          tween(this.maxReachedLabel.node).to(0.1, {
            scale: new Vec3(1.2, 1.2, 1)
          }).to(0.1, {
            scale: Vec3.ONE
          }).start();
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          if (this.donateButton) {
            this.donateButton.targetOff(this);
            this.donateButton.on(Node.EventType.TOUCH_END, this._onDonateClick, this);
          } // 監聽金幣變化，確保按鈕狀態即時更新


          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).on((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).COINS_CHANGED, this._onCoinsChanged, this);
        }

        _onCoinsChanged(coins) {
          // 金幣不足時禁用按鈕
          if (this.donateButton) {
            var canAfford = coins >= DONATION_COST;
            var notMaxed = this._donationsThisWeek < MAX_DONATIONS_PER_WEEK;
            this.donateButton.active = canAfford && notMaxed;
          }
        } // ── 公開 API（由 MainGameController 呼叫）────────────────────────────────

        /**
         * 章節重置時呼叫，清空捐獻次數。
         * 通常在週日 20:00 結算後或新章節開始時觸發。
         */


        resetForNewChapter(chapterNumber) {
          this._currentChapter = chapterNumber;
          this._donationsThisWeek = 0;

          this._updateDisplay();

          console.log("[DonationTracker] \u5DF2\u91CD\u7F6E\u6350\u737B\u6B21\u6578\uFF08\u7AE0\u7BC0 " + chapterNumber + "\uFF09");
        }
        /** 取得本週剩餘捐獻次數 */


        getRemainingDonations() {
          return Math.max(0, MAX_DONATIONS_PER_WEEK - this._donationsThisWeek);
        }
        /** 取得捐獻進度（0.0 ~ 1.0）*/


        getProgress() {
          return this._donationsThisWeek / MAX_DONATIONS_PER_WEEK;
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "countLabel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "progressBar", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "donateButton", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "donateButtonLabel", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "maxReachedLabel", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=0711727ae9ffd08c855626cc3580f2f79078784a.js.map