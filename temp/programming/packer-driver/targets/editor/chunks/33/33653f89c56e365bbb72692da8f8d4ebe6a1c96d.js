System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, Node, Sprite, AudioSource, assetManager, Texture2D, SpriteFrame, SoundManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _crd, ccclass, property, ChapterStoryModal;

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
      Sprite = _cc.Sprite;
      AudioSource = _cc.AudioSource;
      assetManager = _cc.assetManager;
      Texture2D = _cc.Texture2D;
      SpriteFrame = _cc.SpriteFrame;
    }, function (_unresolved_2) {
      SoundManager = _unresolved_2.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "f8d4cxxNe1Nd4bWywNCdE5g", "ChapterStoryModal", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Label', 'Node', 'Sprite', 'AudioSource', 'assetManager', 'ImageAsset', 'Texture2D', 'SpriteFrame']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("ChapterStoryModal", ChapterStoryModal = (_dec = ccclass('ChapterStoryModal'), _dec2 = property(Label), _dec3 = property(Label), _dec4 = property(Label), _dec5 = property(Sprite), _dec6 = property(AudioSource), _dec7 = property(Node), _dec8 = property(Node), _dec(_class = (_class2 = class ChapterStoryModal extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座 ────────────────────────────────────────────
          _initializerDefineProperty(this, "chapterTitleLabel", _descriptor, this);

          _initializerDefineProperty(this, "storyContentLabel", _descriptor2, this);

          _initializerDefineProperty(this, "winnerLabel", _descriptor3, this);

          _initializerDefineProperty(this, "bgImageSprite", _descriptor4, this);

          _initializerDefineProperty(this, "bgMusicSource", _descriptor5, this);

          _initializerDefineProperty(this, "closeButton", _descriptor6, this);

          _initializerDefineProperty(this, "backdropNode", _descriptor7, this);

          // ── 私有狀態 ──────────────────────────────────────────────────
          this._fullText = '';
          this._charIndex = 0;
          this._typing = false;
        }

        // ── 生命週期 ──────────────────────────────────────────────────
        onLoad() {
          this._registerEvents();
        }

        onDestroy() {
          var _this$closeButton, _this$backdropNode;

          this.unscheduleAllCallbacks();
          (_this$closeButton = this.closeButton) == null || _this$closeButton.targetOff(this);
          (_this$backdropNode = this.backdropNode) == null || _this$backdropNode.targetOff(this);
        } // ── 公開 API ──────────────────────────────────────────────────


        async init(config) {
          // 設定標題
          if (this.chapterTitleLabel) {
            this.chapterTitleLabel.string = config.title;
          } // 設定勝利陣營


          if (this.winnerLabel && config.winnerFaction) {
            const factionName = config.winnerFaction === 'Pure' ? '淨塵者' : '濁息者';
            this.winnerLabel.string = `${factionName} 獲勝`;
          } // 載入背景圖


          if (config.bgImageUrl && this.bgImageSprite) {
            await this._loadBgImage(config.bgImageUrl);
          } // 播放背景音樂


          if (config.bgMusicUrl && this.bgMusicSource) {// TODO: 載入並播放音樂
            // 需要先把音樂檔案放到 Cocos 的 resources 資料夾
          } // 啟動打字機效果


          this._fullText = config.content;
          this._charIndex = 0;
          this._typing = true;

          if (this.storyContentLabel) {
            this.storyContentLabel.string = '';
          }

          this.unscheduleAllCallbacks();
          this.schedule(this._typeNextChar, 0.08);
        } // ── 打字機效果 ────────────────────────────────────────────────


        _typeNextChar() {
          if (!this.storyContentLabel) return;

          if (this._charIndex < this._fullText.length) {
            this._charIndex++;
            this.storyContentLabel.string = this._fullText.slice(0, this._charIndex);

            if (this._charIndex % 3 === 0) {
              (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
                error: Error()
              }), SoundManager) : SoundManager).panelOpen();
            }
          } else {
            this.unscheduleAllCallbacks();
            this._typing = false;
          }
        } // ── 載入背景圖（從網址） ──────────────────────────────────────


        async _loadBgImage(url) {
          return new Promise((resolve, reject) => {
            assetManager.loadRemote(url, (err, imageAsset) => {
              if (err) {
                console.warn('[ChapterStoryModal] 載入背景圖失敗', err);
                reject(err);
                return;
              }

              const texture = new Texture2D();
              texture.image = imageAsset;
              const spriteFrame = new SpriteFrame();
              spriteFrame.texture = texture;

              if (this.bgImageSprite) {
                this.bgImageSprite.spriteFrame = spriteFrame;
              }

              resolve();
            });
          });
        } // ── 關閉邏輯 ──────────────────────────────────────────────────


        _onTap() {
          if (this._typing) {
            // 略過打字機
            this.unscheduleAllCallbacks();
            this._typing = false;

            if (this.storyContentLabel) {
              this.storyContentLabel.string = this._fullText;
            }
          } else {
            // 關閉 Modal
            this._close();
          }
        }

        _close() {
          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen();
          this.node.emit('close-modal');
          this.node.active = false;
        } // ── 事件註冊 ──────────────────────────────────────────────────


        _registerEvents() {
          if (this.closeButton) {
            this.closeButton.targetOff(this);
            this.closeButton.on(Node.EventType.TOUCH_END, this._onTap, this);
          }

          if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onTap, this);
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "chapterTitleLabel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "storyContentLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "winnerLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "bgImageSprite", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "bgMusicSource", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "closeButton", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "backdropNode", [_dec8], {
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
//# sourceMappingURL=33653f89c56e365bbb72692da8f8d4ebe6a1c96d.js.map