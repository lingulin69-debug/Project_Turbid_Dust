System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Color, Component, Label, Sprite, tween, DataEventBus, DATA_EVENTS, DataManager, PTD_UI_THEME, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _crd, ccclass, property, TWEEN_DURATION, COLOR_DRAW, BalanceOverlay;

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

  function _reportPossibleCrUseOfBalanceResult(extras) {
    _reporterNs.report("BalanceResult", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPTD_UI_THEME(extras) {
    _reporterNs.report("PTD_UI_THEME", "./PTD_UI_Theme", _context.meta, extras);
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
      Color = _cc.Color;
      Component = _cc.Component;
      Label = _cc.Label;
      Sprite = _cc.Sprite;
      tween = _cc.tween;
    }, function (_unresolved_2) {
      DataEventBus = _unresolved_2.DataEventBus;
      DATA_EVENTS = _unresolved_2.DATA_EVENTS;
      DataManager = _unresolved_2.DataManager;
    }, function (_unresolved_3) {
      PTD_UI_THEME = _unresolved_3.PTD_UI_THEME;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "33b97j1XDZKM7kIFtidfwn1", "BalanceOverlay", undefined);

      __checkObsolete__(['_decorator', 'Color', 'Component', 'Label', 'Sprite', 'tween']);

      ({
        ccclass,
        property
      } = _decorator); // ── 常數 ──────────────────────────────────────────────────────────────────────

      TWEEN_DURATION = 0.6; // 進度條動畫時長（秒）

      COLOR_DRAW = new Color(180, 170, 155, 255); // 均勢：米灰色
      // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("BalanceOverlay", BalanceOverlay = (_dec = ccclass('BalanceOverlay'), _dec2 = property(Sprite), _dec3 = property(Sprite), _dec4 = property(Label), _dec5 = property(Label), _dec(_class = (_class2 = class BalanceOverlay extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /**
           * 濁息勢力進度條 Sprite。
           * ⚠️ 編輯器中此 Sprite 的 Type 必須設為「Filled」，
           *    Fill Dir 設為水平方向，才能用 fillRange 驅動動畫。
           */
          _initializerDefineProperty(this, "turbidBar", _descriptor, this);

          /**
           * 淨塵勢力進度條 Sprite。
           * ⚠️ 同上，Type 設為「Filled」。
           */
          _initializerDefineProperty(this, "pureBar", _descriptor2, this);

          /** 顯示具體天平數值（如 -45 或 +20）*/
          _initializerDefineProperty(this, "balanceLabel", _descriptor3, this);

          /** 顯示當前佔優陣營名稱（濁息者 / 淨塵者 / 均勢）*/
          _initializerDefineProperty(this, "dominantFactionLabel", _descriptor4, this);
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).on((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).BALANCE_UPDATED, this._onBalanceUpdated, this); // 場景載入後立即渲染當前快照

          const initial = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).calculateBalance();

          this._render(initial);
        }

        onDestroy() {
          (_crd && DataEventBus === void 0 ? (_reportPossibleCrUseOfDataEventBus({
            error: Error()
          }), DataEventBus) : DataEventBus).off((_crd && DATA_EVENTS === void 0 ? (_reportPossibleCrUseOfDATA_EVENTS({
            error: Error()
          }), DATA_EVENTS) : DATA_EVENTS).BALANCE_UPDATED, this._onBalanceUpdated, this);
        } // ── 事件接收 ──────────────────────────────────────────────────────────────


        _onBalanceUpdated(result) {
          this._render(result);
        } // ── 視覺渲染 ──────────────────────────────────────────────────────────────


        _render(result) {
          this._updateBars(result.balance_value);

          this._updateLabels(result);
        }
        /**
         * 以 fillRange 動畫更新兩條勢力進度條。
         *
         * 計算公式（balance_value 範圍 -100 ~ +100）：
         *   turbidBar.fillRange = (100 − balance_value) / 200
         *   pureBar.fillRange   = (100 + balance_value) / 200
         *
         * 範例：balance_value = -60（Turbid 優勢）
         *   → turbidBar = 0.8，pureBar = 0.2
         */


        _updateBars(balanceValue) {
          const turbidFill = (100 - balanceValue) / 200;
          const pureFill = (100 + balanceValue) / 200;

          if (this.turbidBar) {
            tween(this.turbidBar).to(TWEEN_DURATION, {
              fillRange: turbidFill
            }).start();
          }

          if (this.pureBar) {
            tween(this.pureBar).to(TWEEN_DURATION, {
              fillRange: pureFill
            }).start();
          }
        }

        _updateLabels(result) {
          // 天平數值：正數加 + 前綴讓讀取更直觀
          if (this.balanceLabel) {
            const sign = result.balance_value > 0 ? '+' : '';
            this.balanceLabel.string = `${sign}${Math.round(result.balance_value)}`;
          } // 優勢陣營名稱與顏色


          if (this.dominantFactionLabel) {
            const {
              text,
              color
            } = this._getDominantDisplay(result.dominant);

            this.dominantFactionLabel.string = text;
            this.dominantFactionLabel.color = color;
          }
        }

        _getDominantDisplay(dominant) {
          switch (dominant) {
            case 'Turbid':
              return {
                text: '濁息者',
                color: (_crd && PTD_UI_THEME === void 0 ? (_reportPossibleCrUseOfPTD_UI_THEME({
                  error: Error()
                }), PTD_UI_THEME) : PTD_UI_THEME).Turbid.textPrimary
              };

            case 'Pure':
              return {
                text: '淨塵者',
                color: (_crd && PTD_UI_THEME === void 0 ? (_reportPossibleCrUseOfPTD_UI_THEME({
                  error: Error()
                }), PTD_UI_THEME) : PTD_UI_THEME).Pure.textPrimary
              };

            default:
              return {
                text: '均勢',
                color: COLOR_DRAW
              };
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "turbidBar", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "pureBar", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "balanceLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "dominantFactionLabel", [_dec5], {
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
//# sourceMappingURL=ed87fa2b0ddf8a16e3189d0ef8522cc4a56c9441.js.map