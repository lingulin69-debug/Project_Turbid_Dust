System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Color, Component, Label, Material, Node, Sprite, tween, Vec3, applyFactionMaterial, getPageTheme, SoundManager, DataEventBus, DATA_EVENTS, DataManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _crd, ccclass, property, RELIC_POEM_TRIGGER, WC_COLORS, WhiteCrowCard;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfapplyFactionMaterial(extras) {
    _reporterNs.report("applyFactionMaterial", "./PTD_UI_Theme", _context.meta, extras);
  }

  function _reportPossibleCrUseOfFactionType(extras) {
    _reporterNs.report("FactionType", "./PTD_UI_Theme", _context.meta, extras);
  }

  function _reportPossibleCrUseOfgetPageTheme(extras) {
    _reporterNs.report("getPageTheme", "./PTD_UI_Theme", _context.meta, extras);
  }

  function _reportPossibleCrUseOfSoundManager(extras) {
    _reporterNs.report("SoundManager", "./SoundManager", _context.meta, extras);
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

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Color = _cc.Color;
      Component = _cc.Component;
      Label = _cc.Label;
      Material = _cc.Material;
      Node = _cc.Node;
      Sprite = _cc.Sprite;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      applyFactionMaterial = _unresolved_2.applyFactionMaterial;
      getPageTheme = _unresolved_2.getPageTheme;
    }, function (_unresolved_3) {
      SoundManager = _unresolved_3.SoundManager;
    }, function (_unresolved_4) {
      DataEventBus = _unresolved_4.DataEventBus;
      DATA_EVENTS = _unresolved_4.DATA_EVENTS;
      DataManager = _unresolved_4.DataManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "82d03JFje5Hur82y2y41f3T", "WhiteCrowCard", undefined);

      __checkObsolete__(['_decorator', 'Color', 'Component', 'Label', 'Material', 'Node', 'Sprite', 'tween', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── 遺物彩蛋觸發組合 ──────────────────────────────────────────────────────────

      RELIC_POEM_TRIGGER = new Set(['昔日的餘溫', '碎裂的鏡面', '無名者的手稿', '鏽蝕的徽章']); // ── 顏色常數（對應 FACTION_THEMES 的 Cocos 版本）────────────────────────────

      WC_COLORS = {
        Pure: {
          bg: new Color(245, 242, 237),
          // #f5f2ed
          titleText: new Color(90, 78, 68),
          // #5a4e44
          secondaryText: new Color(139, 115, 85),
          // #8b7355
          closeBtn: new Color(139, 115, 85),
          // #8b7355
          border: new Color(184, 159, 134, 89) // rgba(184,159,134,0.35)

        },
        Turbid: {
          bg: new Color(19, 8, 38),
          // #130826
          titleText: new Color(228, 213, 245),
          // #e4d5f5
          secondaryText: new Color(197, 168, 224),
          // #c5a8e0
          closeBtn: new Color(197, 168, 224),
          // #c5a8e0
          border: new Color(124, 58, 237, 102) // rgba(124,58,237,0.4)

        }
      }; // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("WhiteCrowCard", WhiteCrowCard = (_dec = ccclass('WhiteCrowCard'), _dec2 = property(Sprite), _dec3 = property(Label), _dec4 = property(Label), _dec5 = property(Node), _dec6 = property(Node), _dec7 = property(Label), _dec8 = property(Label), _dec9 = property(Label), _dec10 = property([Node]), _dec11 = property(Material), _dec12 = property(Material), _dec(_class = (_class2 = class WhiteCrowCard extends Component {
        constructor(...args) {
          super(...args);

          // ── 暴露給 Inspector 的 UI 節點 ──────────────────────────────────────────
          _initializerDefineProperty(this, "bgSprite", _descriptor, this);

          _initializerDefineProperty(this, "titleLabel", _descriptor2, this);

          _initializerDefineProperty(this, "codeLabel", _descriptor3, this);

          _initializerDefineProperty(this, "closeButtonNode", _descriptor4, this);

          /** 僅在桌機（Canvas ≥ 640）顯示 */
          _initializerDefineProperty(this, "portraitNode", _descriptor5, this);

          _initializerDefineProperty(this, "coinsLabel", _descriptor6, this);

          _initializerDefineProperty(this, "hpLabel", _descriptor7, this);

          _initializerDefineProperty(this, "relicHintLabel", _descriptor8, this);

          /** Tab 按鈕節點陣列，順序對應 tabIndex 0, 1, 2… */
          _initializerDefineProperty(this, "tabButtons", _descriptor9, this);

          // ── Shader / Material 預留接口 ────────────────────────────────────────────
          _initializerDefineProperty(this, "turbidMaterial", _descriptor10, this);

          _initializerDefineProperty(this, "pureMaterial", _descriptor11, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._faction = 'Pure';
          this._activeTab = 0;
        }

        // ── 公開初始化 ────────────────────────────────────────────────────────────
        init(faction, title, code) {
          this._faction = faction;

          this._applyTheme();

          if (title && this.titleLabel) this.titleLabel.string = title;
          if (code && this.codeLabel) this.codeLabel.string = code;

          this._initCoinsDisplay();

          this._initHpDisplay();

          this._registerEvents();
        } // ── 主題套用 ──────────────────────────────────────────────────────────────


        _applyTheme() {
          var _this$closeButtonNode;

          const c = WC_COLORS[this._faction];
          const th = (_crd && getPageTheme === void 0 ? (_reportPossibleCrUseOfgetPageTheme({
            error: Error()
          }), getPageTheme) : getPageTheme)(this._faction);

          if (this.bgSprite) {
            this.bgSprite.color = c.bg;
            (_crd && applyFactionMaterial === void 0 ? (_reportPossibleCrUseOfapplyFactionMaterial({
              error: Error()
            }), applyFactionMaterial) : applyFactionMaterial)(this.bgSprite, this._faction, this.turbidMaterial, this.pureMaterial);
          }

          if (this.titleLabel) {
            this.titleLabel.color = c.titleText;
          }

          if (this.codeLabel) {
            this.codeLabel.color = th.textSecondary;
          } // 關閉按鈕圖示顏色


          const closeIcon = (_this$closeButtonNode = this.closeButtonNode) == null ? void 0 : _this$closeButtonNode.getComponentInChildren(Sprite);
          if (closeIcon) closeIcon.color = c.closeBtn;
        } // ── 貨幣顯示 ──────────────────────────────────────────────────────────────


        _initCoinsDisplay() {
          var _player$coins;

          if (!this.coinsLabel) return;
          const player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer();

          this._updateCoinsLabel((_player$coins = player == null ? void 0 : player.coins) != null ? _player$coins : 0);

          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).on((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).COINS_CHANGED, this._updateCoinsLabel, this);
        }

        _updateCoinsLabel(coins) {
          if (this.coinsLabel) {
            this.coinsLabel.string = `${coins}`;
          }
        } // ── HP 顯示 ───────────────────────────────────────────────────────────────


        _initHpDisplay() {
          var _player$hp;

          if (!this.hpLabel) return;
          const player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer();

          this._updateHpLabel((_player$hp = player == null ? void 0 : player.hp) != null ? _player$hp : 0);

          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).on((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).HP_CHANGED, this._updateHpLabel, this);
        }

        _updateHpLabel(hp) {
          if (!this.hpLabel) return;
          const player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer();
          this.hpLabel.string = player ? `${hp}/${player.max_hp}` : `${hp}`;
          const isLow = player ? hp < player.max_hp / 2 : false;
          this.hpLabel.color = isLow ? new Color(200, 50, 50) // 低血量 → 紅
          : Color.WHITE;
        } // ── Tab 切換 ──────────────────────────────────────────────────────────────


        switchTab(index) {
          if (index === this._activeTab) return;
          this._activeTab = index;
          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen();
          this.node.emit('tab-changed', index);
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          // 關閉按鈕
          if (this.closeButtonNode) {
            this.closeButtonNode.targetOff(this);
            this.closeButtonNode.on(Node.EventType.TOUCH_END, this._onClose, this);
          } // Tab 按鈕：自動綁定，index 對應陣列位置


          this.tabButtons.forEach((btn, index) => {
            btn.targetOff(this);
            btn.on(Node.EventType.TOUCH_END, () => this.switchTab(index), this);
          });
        } // ── 關閉邏輯 ──────────────────────────────────────────────────────────────


        _onClose() {
          tween(this.closeButtonNode).to(0.05, {
            scale: new Vec3(0.88, 0.88, 1)
          }).to(0.05, {
            scale: Vec3.ONE
          }).call(() => {
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).panelOpen();
            this.node.emit('close-card');
          }).start();
        } // ── 隱藏彩蛋：遺物詩篇 ───────────────────────────────────────────────────

        /**
         * 傳入玩家已收集的遺物 ID 陣列。
         * 若包含觸發組合中的所有遺物，廣播 'show-relic-poem'。
         */


        checkRelicPoem(collectedRelics) {
          const collected = new Set(collectedRelics);
          const matched = [...RELIC_POEM_TRIGGER].filter(id => collected.has(id));

          if (matched.length === RELIC_POEM_TRIGGER.size) {
            if (this.relicHintLabel) this.relicHintLabel.string = '';
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).unlock();
            this.node.emit('show-relic-poem');
          } else if (matched.length > 0) {
            const remaining = RELIC_POEM_TRIGGER.size - matched.length;
            if (this.relicHintLabel) this.relicHintLabel.string = `還差 ${remaining} 件`;
            this.node.emit('show-relic-hint', matched.length, RELIC_POEM_TRIGGER.size);
          } else {
            if (this.relicHintLabel) this.relicHintLabel.string = '';
          }
        } // ── 生命週期清理 ──────────────────────────────────────────────────────────


        onDestroy() {
          var _this$closeButtonNode2;

          (_this$closeButtonNode2 = this.closeButtonNode) == null || _this$closeButtonNode2.targetOff(this);
          this.tabButtons.forEach(btn => btn.targetOff(this));
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
        } // ── 公開工具：讓子節點透過 getComponentInParent 取得 faction ──────────────


        get faction() {
          return this._faction;
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "bgSprite", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "titleLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "codeLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "closeButtonNode", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "portraitNode", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "coinsLabel", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "hpLabel", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "relicHintLabel", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "tabButtons", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "turbidMaterial", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "pureMaterial", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=fe12fd01e7e991449235199ebebc5fd1211be8c0.js.map