System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Color, Component, Label, Node, tween, Vec3, SoundManager, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, _crd, ccclass, property, ROLL_INTERVAL, ROLL_DURATION, RESULT_HOLD, COLOR_SUCCESS, COLOR_FAILURE, DiceResultOverlay;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

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
      Color = _cc.Color;
      Component = _cc.Component;
      Label = _cc.Label;
      Node = _cc.Node;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      SoundManager = _unresolved_2.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "e6e33KNB+ZBSrPVLryycFiA", "DiceResultOverlay", undefined);

      __checkObsolete__(['_decorator', 'Color', 'Component', 'Label', 'Node', 'tween', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── 擲骰結果資料 ──────────────────────────────────────────────────────────────

      // ── 常數 ──────────────────────────────────────────────────────────────────────
      ROLL_INTERVAL = 0.05; // 數字跳動頻率（秒）

      ROLL_DURATION = 0.6; // 跳動持續時間（秒）

      RESULT_HOLD = 1.2; // 結果停留時間（秒）

      COLOR_SUCCESS = new Color(100, 220, 120, 255); // 綠色系

      COLOR_FAILURE = new Color(220, 80, 80, 255); // 紅色系
      // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("DiceResultOverlay", DiceResultOverlay = (_dec = ccclass('DiceResultOverlay'), _dec2 = property(Label), _dec3 = property(Label), _dec4 = property(Node), _dec(_class = (_class2 = class DiceResultOverlay extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /** 跳動數字與最終點數 */
          _initializerDefineProperty(this, "diceNumberLabel", _descriptor, this);

          /** 大字「成功」或「失敗」 */
          _initializerDefineProperty(this, "resultTextLabel", _descriptor2, this);

          /** 整體視覺容器（active 控制顯示/隱藏）*/
          _initializerDefineProperty(this, "overlayNode", _descriptor3, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._rolling = false;
        }

        // ── 公開 API ──────────────────────────────────────────────────────────────

        /**
         * 觸發一次 D20 擲骰流程。
         * 建議由 MainGameController._handleInnHeal() 等業務邏輯呼叫。
         *
         * @param targetValue  成功門檻（骰出 >= targetValue 即成功）
         * @param hasAdvantage 優勢擲骰：投兩次取高者
         */
        rollDice(targetValue, hasAdvantage = false) {
          if (this._rolling) return;
          this._rolling = true; // 顯示容器，隱藏結果文字

          if (this.overlayNode) this.overlayNode.active = true;
          if (this.resultTextLabel) this.resultTextLabel.node.active = false; // 背景計算最終結果

          const finalNumber = hasAdvantage ? Math.max(this._d20(), this._d20()) : this._d20();
          const isSuccess = finalNumber >= targetValue; // 啟動跳動動畫

          let elapsed = 0;
          this.schedule(function () {
            elapsed += ROLL_INTERVAL;

            if (elapsed < ROLL_DURATION) {
              // 跳動中：顯示隨機假數字
              if (this.diceNumberLabel) {
                this.diceNumberLabel.string = `${this._d20()}`;
              }
            } else {
              // 跳動結束：鎖定真實結果
              this.unscheduleAllCallbacks();

              this._showResult(finalNumber, isSuccess);
            }
          }, ROLL_INTERVAL);
        } // ── 私有方法 ──────────────────────────────────────────────────────────────

        /** 產生 1–20 的隨機整數 */


        _d20() {
          return Math.floor(Math.random() * 20) + 1;
        }

        _showResult(finalNumber, isSuccess) {
          // 鎖定點數
          if (this.diceNumberLabel) {
            this.diceNumberLabel.string = `${finalNumber}`;
          } // TODO：換用 SoundManager.diceRoll() 當骰子音效建立後


          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen(); // 結果標籤

          if (this.resultTextLabel) {
            this.resultTextLabel.string = isSuccess ? '成功' : '失敗';
            this.resultTextLabel.color = isSuccess ? COLOR_SUCCESS : COLOR_FAILURE;
            this.resultTextLabel.node.active = true;
            this.resultTextLabel.node.setScale(Vec3.ZERO);
            tween(this.resultTextLabel.node).to(0.12, {
              scale: new Vec3(1.25, 1.25, 1)
            }).to(0.08, {
              scale: Vec3.ONE
            }).start();
          } // 停留後收起並廣播結果


          this.scheduleOnce(() => {
            this._rolling = false;
            if (this.overlayNode) this.overlayNode.active = false;
            const result = {
              success: isSuccess,
              rollResult: finalNumber
            };
            this.node.emit('dice-finished', result);
          }, RESULT_HOLD);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "diceNumberLabel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "resultTextLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "overlayNode", [_dec4], {
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
//# sourceMappingURL=ed62fc3fcee778fc90bb84c53c6d7a20e74fb08c.js.map