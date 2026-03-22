System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, Node, Sprite, tween, Vec3, getPageTheme, DataEventBus, DATA_EVENTS, DataManager, SoundManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _class3, _crd, ccclass, property, HUDController;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfFactionType(extras) {
    _reporterNs.report("FactionType", "./PTD_UI_Theme", _context.meta, extras);
  }

  function _reportPossibleCrUseOfgetPageTheme(extras) {
    _reporterNs.report("getPageTheme", "./PTD_UI_Theme", _context.meta, extras);
  }

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
      Sprite = _cc.Sprite;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      getPageTheme = _unresolved_2.getPageTheme;
    }, function (_unresolved_3) {
      DataEventBus = _unresolved_3.DataEventBus;
      DATA_EVENTS = _unresolved_3.DATA_EVENTS;
      DataManager = _unresolved_3.DataManager;
    }, function (_unresolved_4) {
      SoundManager = _unresolved_4.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "43bfahVYPBOkYTmwqAbWUHL", "HUDController", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Label', 'Node', 'Sprite', 'tween', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── HUD 面板 ID ───────────────────────────────────────────────────────────────

      // ── 組件 ─────────────────────────────────────────────────────────────────────
      _export("HUDController", HUDController = (_dec = ccclass('HUDController'), _dec2 = property(Label), _dec3 = property(Label), _dec4 = property(Label), _dec5 = property(Sprite), _dec6 = property(Node), _dec7 = property(Node), _dec8 = property(Label), _dec9 = property([Node]), _dec(_class = (_class2 = (_class3 = class HUDController extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector：頂部資訊列 ─────────────────────────────────────────────────
          _initializerDefineProperty(this, "coinsLabel", _descriptor, this);

          _initializerDefineProperty(this, "hpLabel", _descriptor2, this);

          _initializerDefineProperty(this, "ocNameLabel", _descriptor3, this);

          _initializerDefineProperty(this, "factionBadgeSprite", _descriptor4, this);

          _initializerDefineProperty(this, "bellButtonNode", _descriptor5, this);

          /** 鈴鐺上方未讀數字紅點節點 */
          _initializerDefineProperty(this, "bellBadgeNode", _descriptor6, this);

          _initializerDefineProperty(this, "bellBadgeLabel", _descriptor7, this);

          // ── Inspector：左側導航按鈕（順序對應 HUDPanelId）────────────────────────

          /** 順序須對應 NAV_PANELS 陣列：announcement/quest/daily/collection/inventory/npc/settings */
          _initializerDefineProperty(this, "navButtons", _descriptor8, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._activePanelId = null;
          this._unreadCount = 0;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._initDataDisplay();

          this._registerEvents();
        } // ── 初始化 ────────────────────────────────────────────────────────────────

        /** 登入後由主場景呼叫，傳入玩家 faction 設定 HUD 主題。 */


        initTheme(faction) {
          const th = (_crd && getPageTheme === void 0 ? (_reportPossibleCrUseOfgetPageTheme({
            error: Error()
          }), getPageTheme) : getPageTheme)(faction);
          if (this.ocNameLabel) this.ocNameLabel.color = th.textPrimary;
          if (this.coinsLabel) this.coinsLabel.color = th.textPrimary;
          if (this.hpLabel) this.hpLabel.color = th.textPrimary;
        }

        _initDataDisplay() {
          const player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer();

          if (player) {
            if (this.ocNameLabel) this.ocNameLabel.string = player.oc_name;

            this._updateCoinsLabel(player.coins);

            this._updateHpLabel(player.hp);
          }

          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).on((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).COINS_CHANGED, this._updateCoinsLabel, this);
          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).on((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).HP_CHANGED, this._updateHpLabel, this);
        } // ── 數值更新 ──────────────────────────────────────────────────────────────


        _updateCoinsLabel(coins) {
          if (this.coinsLabel) this.coinsLabel.string = `${coins}`;
        }

        _updateHpLabel(hp) {
          if (!this.hpLabel) return;
          const player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer();
          this.hpLabel.string = player ? `${hp}/${player.max_hp}` : `${hp}`;
        } // ── 未讀通知 ──────────────────────────────────────────────────────────────


        setUnreadCount(count) {
          this._unreadCount = count;
          const visible = count > 0;
          if (this.bellBadgeNode) this.bellBadgeNode.active = visible;
          if (this.bellBadgeLabel) this.bellBadgeLabel.string = count > 99 ? '99+' : `${count}`;
        } // ── 導航面板開關 ──────────────────────────────────────────────────────────

        /**
         * 切換指定面板。若已開啟同一面板則關閉。
         * 向外 emit 'panel-open' 或 'panel-close'，主場景負責顯示/隱藏對應面板節點。
         */


        togglePanel(panelId) {
          if (this._activePanelId === panelId) {
            this._activePanelId = null;
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).panelOpen();
            this.node.emit('panel-close', panelId);
          } else {
            this._activePanelId = panelId;
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).panelOpen();
            this.node.emit('panel-open', panelId);
          }
        }
        /** 強制關閉所有面板（點擊地圖背景時呼叫）。 */


        closeAllPanels() {
          if (!this._activePanelId) return;
          const prev = this._activePanelId;
          this._activePanelId = null;
          this.node.emit('panel-close', prev);
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          // 導航按鈕
          HUDController.NAV_PANELS.forEach((panelId, index) => {
            const btn = this.navButtons[index];
            if (!btn) return;
            btn.targetOff(this);
            btn.on(Node.EventType.TOUCH_END, () => this._onNavButtonTap(btn, panelId), this);
          }); // 鈴鐺按鈕

          if (this.bellButtonNode) {
            this.bellButtonNode.targetOff(this);
            this.bellButtonNode.on(Node.EventType.TOUCH_END, this._onBellTap, this);
          }
        } // ── 按鈕回呼 ──────────────────────────────────────────────────────────────


        _onNavButtonTap(btn, panelId) {
          tween(btn).to(0.05, {
            scale: new Vec3(0.88, 0.88, 1)
          }).to(0.05, {
            scale: Vec3.ONE
          }).call(() => this.togglePanel(panelId)).start();
        }

        _onBellTap() {
          tween(this.bellButtonNode).to(0.05, {
            scale: new Vec3(0.88, 0.88, 1)
          }).to(0.05, {
            scale: Vec3.ONE
          }).call(() => {
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).bell();
            this.setUnreadCount(0);
            this.node.emit('bell-tapped');
          }).start();
        } // ── 章節劇情按鈕控制 (新增) ──────────────────────────────────────────────

        /** 由 MainGameController 呼叫，顯示進入劇情的提示按鈕 */


        showChapterStoryButton(chapterNumber) {
          console.log(`[HUDController] 準備顯示第 ${chapterNumber} 章結算劇情按鈕`); // TODO: 這裡日後可以綁定一個真實的 UI 按鈕，讓它 active = true
          // 玩家點擊該按鈕時，請執行：this.node.emit('chapter-story-click');
          // 為了方便現在測試，我們直接模擬玩家 2 秒後點擊了按鈕：

          this.scheduleOnce(() => {
            this.node.emit('chapter-story-click');
          }, 2.0);
        }
        /** 隱藏劇情按鈕 */


        hideChapterStoryButton() {
          console.log(`[HUDController] 隱藏章節劇情按鈕`); // TODO: 將真實的 UI 按鈕 active = false
        } // ── 生命週期清理 ──────────────────────────────────────────────────────────


        onDestroy() {
          var _this$bellButtonNode;

          this.navButtons.forEach(btn => btn == null ? void 0 : btn.targetOff(this));
          (_this$bellButtonNode = this.bellButtonNode) == null || _this$bellButtonNode.targetOff(this);
          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).off((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).COINS_CHANGED, this._updateCoinsLabel, this);
          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).off((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).HP_CHANGED, this._updateHpLabel, this);
        }

      }, _class3.NAV_PANELS = ['announcement', 'quest', 'daily', 'collection', 'inventory', 'npc', 'settings'], _class3), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "coinsLabel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "hpLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "ocNameLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "factionBadgeSprite", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "bellButtonNode", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "bellBadgeNode", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "bellBadgeLabel", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "navButtons", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=e6c55d65663916c9505b0e6131aa7530f109d316.js.map