System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, Node, SoundManager, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _crd, ccclass, property, TYPEWRITER_INTERVAL, SOUND_EVERY_N_CHARS, RelicPoemModal;

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
      Component = _cc.Component;
      Label = _cc.Label;
      Node = _cc.Node;
    }, function (_unresolved_2) {
      SoundManager = _unresolved_2.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "8facfDyQj5BGYIu6npe6kb7", "RelicPoemModal", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Label', 'Node']);

      ({
        ccclass,
        property
      } = _decorator); // ── 常數 ──────────────────────────────────────────────────────────────────────

      TYPEWRITER_INTERVAL = 0.08; // 每字間隔（秒）

      SOUND_EVERY_N_CHARS = 3; // 每 N 個字播一次音效（避免音效過度密集）
      // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("RelicPoemModal", RelicPoemModal = (_dec = ccclass('RelicPoemModal'), _dec2 = property(Label), _dec3 = property(Label), _dec4 = property(Node), _dec5 = property(Node), _dec(_class = (_class2 = class RelicPoemModal extends Component {
        constructor() {
          super(...arguments);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /** 詩歌本文，由打字機效果逐字填入 */
          _initializerDefineProperty(this, "poemLabel", _descriptor, this);

          /** 署名，詩歌打完後才顯示 */
          _initializerDefineProperty(this, "authorLabel", _descriptor2, this);

          /**
           * 深色遮罩背景節點。
           * ⚠️ 設計師注意：Color 請設為 (0, 0, 0, 180)。
           *    嚴禁使用 backdrop-filter — Cocos 無原生支援且極耗效能。
           *    尺寸需撐滿整個 Canvas，層級置於 Modal 內容節點下方。
           */
          _initializerDefineProperty(this, "backdropNode", _descriptor3, this);

          /** 關閉按鈕（打字機播完後才啟用，或點擊直接略過）*/
          _initializerDefineProperty(this, "closeButtonNode", _descriptor4, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._fullText = '';
          this._authorText = '';
          this._charIndex = 0;
          this._isTyping = false;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._registerEvents();
        }

        onDestroy() {
          var _this$closeButtonNode, _this$backdropNode;

          this.unscheduleAllCallbacks();
          (_this$closeButtonNode = this.closeButtonNode) == null || _this$closeButtonNode.targetOff(this);
          (_this$backdropNode = this.backdropNode) == null || _this$backdropNode.targetOff(this);
        } // ── 公開 API ──────────────────────────────────────────────────────────────

        /**
         * 由 MainGameController 在收到 'show-relic-poem' 後呼叫。
         * @param content 詩歌全文
         * @param author  署名（可選，預設空白）
         */


        init(content, author) {
          if (author === void 0) {
            author = '';
          }

          this._fullText = content;
          this._authorText = author;
          this._charIndex = 0;
          this._isTyping = true;
          if (this.poemLabel) this.poemLabel.string = '';

          if (this.authorLabel) {
            this.authorLabel.string = '';
            this.authorLabel.node.active = false;
          }

          this.node.active = true;
          this.unscheduleAllCallbacks();
          this.schedule(this._typeNextChar, TYPEWRITER_INTERVAL);
        } // ── 打字機邏輯 ────────────────────────────────────────────────────────────


        _typeNextChar() {
          if (!this.poemLabel) return;

          if (this._charIndex < this._fullText.length) {
            this._charIndex++;
            this.poemLabel.string = this._fullText.slice(0, this._charIndex); // 每 N 個字播一次音效，避免密集播放造成噪音

            if (this._charIndex % SOUND_EVERY_N_CHARS === 0) {
              (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
                error: Error()
              }), SoundManager) : SoundManager).panelOpen();
            }
          } else {
            // 全文播完
            this.unscheduleAllCallbacks();
            this._isTyping = false;

            this._showAuthor();
          }
        }

        _showAuthor() {
          if (!this.authorLabel || !this._authorText) return;
          this.authorLabel.string = this._authorText;
          this.authorLabel.node.active = true;
        } // ── 略過功能 ──────────────────────────────────────────────────────────────

        /** 點擊遮罩或關閉按鈕時：若仍在打字則直接顯示全文，否則關閉 Modal。*/


        _onTap() {
          if (this._isTyping) {
            // 略過打字機，直接顯示完整詩文
            this.unscheduleAllCallbacks();
            this._isTyping = false;
            if (this.poemLabel) this.poemLabel.string = this._fullText;

            this._showAuthor();
          } else {
            this._close();
          }
        }

        _close() {
          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen();
          this.node.emit('close-modal');
          this.node.active = false;
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          if (this.closeButtonNode) {
            this.closeButtonNode.targetOff(this);
            this.closeButtonNode.on(Node.EventType.TOUCH_END, this._onTap, this);
          }

          if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onTap, this);
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "poemLabel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "authorLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "backdropNode", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "closeButtonNode", [_dec5], {
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
//# sourceMappingURL=c12977799e4af67f8f716831f41842c816a4bb09.js.map