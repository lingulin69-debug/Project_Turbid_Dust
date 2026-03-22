System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Sprite, Label, tween, Vec3, AudioSource, resources, AudioClip, SoundManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _crd, ccclass, property, MusicDiscController;

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
      Node = _cc.Node;
      Sprite = _cc.Sprite;
      Label = _cc.Label;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
      AudioSource = _cc.AudioSource;
      resources = _cc.resources;
      AudioClip = _cc.AudioClip;
    }, function (_unresolved_2) {
      SoundManager = _unresolved_2.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "4a710oAEpBJMYdb+d/MoZAx", "MusicDiscController", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Sprite', 'Label', 'tween', 'Vec3', 'AudioSource', 'resources', 'AudioClip']);

      ({
        ccclass,
        property
      } = _decorator); // ── 音樂曲目資料 ──────────────────────────────────────────────────────────────

      // ── 組件 ─────────────────────────────────────────────────────────────────────

      /**
       * MusicDiscController
       * 
       * 動態黑膠唱片音樂控制器。
       * 點擊按鈕展開左側面板，顯示旋轉中的唱片與播放控制。
       * 
       * UI 佈局建議：
       *   收合狀態：
       *   ┌──┐
       *   │🎵│ ← 小按鈕（右側固定）
       *   └──┘
       * 
       *   展開狀態：
       *   ┌─────────────────────────┐
       *   │   🎵 正在播放            │
       *   │                         │
       *   │     ◉ ← 旋轉唱片         │
       *   │                         │
       *   │   曲名：夜幕之城          │
       *   │   演出：白鴉樂團          │
       *   │                         │
       *   │   ⏮  ⏯  ⏭  🔇          │
       *   └─────────────────────────┘
       */
      _export("MusicDiscController", MusicDiscController = (_dec = ccclass('MusicDiscController'), _dec2 = property(Node), _dec3 = property(Node), _dec4 = property(Node), _dec5 = property(Label), _dec6 = property(Label), _dec7 = property(Node), _dec8 = property(Node), _dec9 = property(Node), _dec10 = property(Node), _dec11 = property(Sprite), _dec12 = property(AudioSource), _dec(_class = (_class2 = class MusicDiscController extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /** 收合狀態的小按鈕 */
          _initializerDefineProperty(this, "toggleButton", _descriptor, this);

          /** 展開後的面板容器 */
          _initializerDefineProperty(this, "panelNode", _descriptor2, this);

          /** 黑膠唱片節點（會持續旋轉）*/
          _initializerDefineProperty(this, "discNode", _descriptor3, this);

          /** 曲名標籤 */
          _initializerDefineProperty(this, "titleLabel", _descriptor4, this);

          /** 演出者標籤 */
          _initializerDefineProperty(this, "artistLabel", _descriptor5, this);

          /** 播放/暫停按鈕 */
          _initializerDefineProperty(this, "playPauseButton", _descriptor6, this);

          /** 上一首按鈕 */
          _initializerDefineProperty(this, "prevButton", _descriptor7, this);

          /** 下一首按鈕 */
          _initializerDefineProperty(this, "nextButton", _descriptor8, this);

          /** 靜音按鈕 */
          _initializerDefineProperty(this, "muteButton", _descriptor9, this);

          /** 靜音按鈕圖標 Sprite（需切換圖示）*/
          _initializerDefineProperty(this, "muteButtonIcon", _descriptor10, this);

          /** 音樂播放器（AudioSource）*/
          _initializerDefineProperty(this, "musicPlayer", _descriptor11, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._isExpanded = false;
          this._isPlaying = false;
          this._isMuted = false;
          this._currentTrackIndex = 0;
          this._discRotation = 0;
          // 唱片當前旋轉角度

          /** 播放清單（從 resources/music/ 載入）*/
          this._playlist = [{
            id: 'track_01',
            title: '夜幕之城',
            artist: '白鴉樂團',
            filePath: 'music/night_city'
          }, {
            id: 'track_02',
            title: '濁息之舞',
            artist: '未知',
            filePath: 'music/turbid_dance'
          }, {
            id: 'track_03',
            title: '淨塵迴響',
            artist: '純淨之聲',
            filePath: 'music/pure_echo'
          }, {
            id: 'track_04',
            title: '天平之歌',
            artist: '白鴉樂團',
            filePath: 'music/balance_theme'
          }];
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._registerEvents();

          this._loadTrack(this._currentTrackIndex);

          this.panelNode.active = false;
        }

        update(dt) {
          // 唱片持續旋轉（播放時）
          if (this._isPlaying && this.discNode) {
            this._discRotation += dt * 60; // 每秒 60 度

            this.discNode.setRotationFromEuler(0, 0, -this._discRotation);
          }
        }

        onDestroy() {
          var _this$toggleButton, _this$playPauseButton, _this$prevButton, _this$nextButton, _this$muteButton;

          (_this$toggleButton = this.toggleButton) == null || _this$toggleButton.targetOff(this);
          (_this$playPauseButton = this.playPauseButton) == null || _this$playPauseButton.targetOff(this);
          (_this$prevButton = this.prevButton) == null || _this$prevButton.targetOff(this);
          (_this$nextButton = this.nextButton) == null || _this$nextButton.targetOff(this);
          (_this$muteButton = this.muteButton) == null || _this$muteButton.targetOff(this);
        } // ── 展開/收合 ─────────────────────────────────────────────────────────────


        _togglePanel() {
          this._isExpanded = !this._isExpanded;

          if (this._isExpanded) {
            this._showPanel();
          } else {
            this._hidePanel();
          }

          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen();
        }

        _showPanel() {
          this.panelNode.active = true;
          this.panelNode.setScale(Vec3.ZERO);
          tween(this.panelNode).to(0.2, {
            scale: Vec3.ONE
          }, {
            easing: 'backOut'
          }).start();
        }

        _hidePanel() {
          tween(this.panelNode).to(0.15, {
            scale: Vec3.ZERO
          }, {
            easing: 'backIn'
          }).call(() => {
            this.panelNode.active = false;
          }).start();
        } // ── 音樂載入 ──────────────────────────────────────────────────────────────


        _loadTrack(index) {
          if (index < 0 || index >= this._playlist.length) return;
          const track = this._playlist[index];
          this._currentTrackIndex = index; // 更新 UI

          if (this.titleLabel) this.titleLabel.string = track.title;
          if (this.artistLabel) this.artistLabel.string = track.artist; // 載入音樂檔案

          resources.load(track.filePath, AudioClip, (err, clip) => {
            if (err) {
              console.warn(`[MusicDiscController] 載入音樂失敗：${track.filePath}`, err);
              return;
            }

            if (this.musicPlayer) {
              // ✅ 重要修正：清除上一首歌遺留的結束事件，避免切歌 Bug
              this.musicPlayer.node.targetOff(this);
              this.musicPlayer.clip = clip;
              this.musicPlayer.loop = false; // 重新監聽新歌的結束事件

              this.musicPlayer.node.once(AudioSource.EventType.ENDED, this._onTrackEnded, this);
            }
          });
        } // ── 播放控制 ──────────────────────────────────────────────────────────────


        _togglePlayPause() {
          if (!this.musicPlayer || !this.musicPlayer.clip) return;

          if (this._isPlaying) {
            this._pause();
          } else {
            this._play();
          }
        }

        _play() {
          if (!this.musicPlayer) return;
          this.musicPlayer.play();
          this._isPlaying = true; // 更新播放按鈕圖標（切換為「暫停」圖示）
          // TODO: 實作圖示切換

          console.log('[MusicDiscController] 播放');
        }

        _pause() {
          if (!this.musicPlayer) return;
          this.musicPlayer.pause();
          this._isPlaying = false; // 更新播放按鈕圖標（切換為「播放」圖示）

          console.log('[MusicDiscController] 暫停');
        }

        _playPrev() {
          let prevIndex = this._currentTrackIndex - 1;
          if (prevIndex < 0) prevIndex = this._playlist.length - 1;

          this._loadTrack(prevIndex);

          if (this._isPlaying) this._play();
        }

        _playNext() {
          let nextIndex = this._currentTrackIndex + 1;
          if (nextIndex >= this._playlist.length) nextIndex = 0;

          this._loadTrack(nextIndex);

          if (this._isPlaying) this._play();
        }

        _onTrackEnded() {
          // 自動播放下一首
          this._playNext();
        } // ── 靜音控制 ─────────────────────────────────────────────────────────────


        _toggleMute() {
          this._isMuted = !this._isMuted;

          if (this.musicPlayer) {
            this.musicPlayer.volume = this._isMuted ? 0 : 1;
          } // 更新靜音按鈕圖標


          if (this.muteButtonIcon) {// TODO: 切換圖示（🔊 ↔ 🔇）
            // this.muteButtonIcon.spriteFrame = this._isMuted ? mutedIcon : unmutedIcon;
          }

          console.log(`[MusicDiscController] ${this._isMuted ? '靜音' : '取消靜音'}`);
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          if (this.toggleButton) {
            this.toggleButton.targetOff(this);
            this.toggleButton.on(Node.EventType.TOUCH_END, () => {
              tween(this.toggleButton).to(0.05, {
                scale: new Vec3(0.88, 0.88, 1)
              }).to(0.05, {
                scale: Vec3.ONE
              }).call(() => this._togglePanel()).start();
            }, this);
          }

          if (this.playPauseButton) {
            this.playPauseButton.targetOff(this);
            this.playPauseButton.on(Node.EventType.TOUCH_END, () => {
              this._buttonAnimation(this.playPauseButton, () => this._togglePlayPause());
            }, this);
          }

          if (this.prevButton) {
            this.prevButton.targetOff(this);
            this.prevButton.on(Node.EventType.TOUCH_END, () => {
              this._buttonAnimation(this.prevButton, () => this._playPrev());
            }, this);
          }

          if (this.nextButton) {
            this.nextButton.targetOff(this);
            this.nextButton.on(Node.EventType.TOUCH_END, () => {
              this._buttonAnimation(this.nextButton, () => this._playNext());
            }, this);
          }

          if (this.muteButton) {
            this.muteButton.targetOff(this);
            this.muteButton.on(Node.EventType.TOUCH_END, () => {
              this._buttonAnimation(this.muteButton, () => this._toggleMute());
            }, this);
          }
        }
        /** 通用按鈕動畫 */


        _buttonAnimation(btn, callback) {
          tween(btn).to(0.05, {
            scale: new Vec3(0.88, 0.88, 1)
          }).to(0.08, {
            scale: Vec3.ONE
          }).call(() => {
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).panelOpen();
            callback();
          }).start();
        } // ── 公開 API ──────────────────────────────────────────────────────────────

        /** 外部呼叫：切換播放/暫停 */


        togglePlay() {
          this._togglePlayPause();
        }
        /** 外部呼叫：靜音/取消靜音 */


        toggleMute() {
          this._toggleMute();
        }
        /** 取得當前播放狀態 */


        isPlaying() {
          return this._isPlaying;
        }
        /** 取得當前曲目資訊 */


        getCurrentTrack() {
          return this._playlist[this._currentTrackIndex];
        }
        /** 設定播放清單（外部注入）*/


        setPlaylist(tracks) {
          if (tracks.length === 0) return;
          this._playlist = tracks;
          this._currentTrackIndex = 0;

          this._loadTrack(0);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "toggleButton", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "panelNode", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "discNode", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "titleLabel", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "artistLabel", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "playPauseButton", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "prevButton", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "nextButton", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "muteButton", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "muteButtonIcon", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "musicPlayer", [_dec12], {
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
//# sourceMappingURL=6cd1e82ed41c17d41350db7ce596a11065b166e8.js.map