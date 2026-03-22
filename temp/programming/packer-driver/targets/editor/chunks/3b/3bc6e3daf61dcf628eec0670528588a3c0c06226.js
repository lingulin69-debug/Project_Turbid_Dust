System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Color, Component, Label, Node, Prefab, instantiate, tween, Vec3, Sprite, sys, getPageTheme, SoundManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _crd, ccclass, property, EventCalendar;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfgetPageTheme(extras) {
    _reporterNs.report("getPageTheme", "./PTD_UI_Theme", _context.meta, extras);
  }

  function _reportPossibleCrUseOfFactionType(extras) {
    _reporterNs.report("FactionType", "./PTD_UI_Theme", _context.meta, extras);
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
      Color = _cc.Color;
      Component = _cc.Component;
      Label = _cc.Label;
      Node = _cc.Node;
      Prefab = _cc.Prefab;
      instantiate = _cc.instantiate;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
      Sprite = _cc.Sprite;
      sys = _cc.sys;
    }, function (_unresolved_2) {
      getPageTheme = _unresolved_2.getPageTheme;
    }, function (_unresolved_3) {
      SoundManager = _unresolved_3.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "e368ec1UDFDRbw6hFwW3N05", "EventCalendar", undefined);

      __checkObsolete__(['_decorator', 'Color', 'Component', 'Label', 'Node', 'Prefab', 'instantiate', 'tween', 'Vec3', 'Sprite', 'sys']);

      ({
        ccclass,
        property
      } = _decorator); // ── 日曆事件資料介面 ──────────────────────────────────────────────────────────

      // ── 組件 ─────────────────────────────────────────────────────────────────────

      /**
       * EventCalendar
       * 
       * 企劃活動日曆，顯示未來一週的重要事件。
       * 特別標示每週日 20:00 的章節結算時間。
       * 
       * UI 佈局建議：
       *   ┌─────────────────────────────────┐
       *   │  📅 本週活動                     │
       *   │  ────────────────────────────   │
       *   │  04/06 週日 20:00               │
       *   │  🏆 第一章結算                   │
       *   │  ────────────────────────────   │
       *   │  04/08 週二 14:00               │
       *   │  🔧 系統維護                     │
       *   └─────────────────────────────────┘
       */
      _export("EventCalendar", EventCalendar = (_dec = ccclass('EventCalendar'), _dec2 = property(Node), _dec3 = property(Prefab), _dec4 = property(Label), _dec5 = property(Node), _dec6 = property(Node), _dec(_class = (_class2 = class EventCalendar extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /** 日曆容器（ScrollView 內容區）*/
          _initializerDefineProperty(this, "eventContainer", _descriptor, this);

          /** 事件卡片 Prefab */
          _initializerDefineProperty(this, "eventCardPrefab", _descriptor2, this);

          /** 空狀態提示（當沒有事件時顯示）*/
          _initializerDefineProperty(this, "emptyLabel", _descriptor3, this);

          /** 關閉按鈕 */
          _initializerDefineProperty(this, "closeButton", _descriptor4, this);

          /** 遮罩層 */
          _initializerDefineProperty(this, "backdropNode", _descriptor5, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._events = [];
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._loadEvents(); // 異步載入，不阻塞 onLoad


          this._registerEvents();
        }

        start() {
          this._renderEvents(); // 確保資料載入後才渲染

        }

        onDestroy() {
          var _this$closeButton, _this$backdropNode;

          (_this$closeButton = this.closeButton) == null || _this$closeButton.targetOff(this);
          (_this$backdropNode = this.backdropNode) == null || _this$backdropNode.targetOff(this);
        } // ── 資料載入 ──────────────────────────────────────────────────────────────
        // <-- 記得在最上面 import sys

        /** 從 Supabase 拉取未來三個月的事件，並自動補上週日結算 */


        async _loadEvents() {
          try {
            const now = new Date(); // 改為 90 天 (約三個月)

            const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            const response = await fetch(`https://你的專案.supabase.co/rest/v1/td_calendar_events?event_date=gte.${now.toISOString()}&event_date=lte.${threeMonthsLater.toISOString()}&order=event_date.asc`, {
              headers: {
                'apikey': 'YOUR_ANON_KEY',
                'Authorization': 'Bearer YOUR_ANON_KEY'
              }
            });
            this._events = (await response.json()) || [];

            this._checkDailyReminder(); // 執行每日登入提醒

          } catch (err) {
            console.warn('[EventCalendar] 載入事件失敗', err);
          }
        }
        /** 每日登入時檢查 24 小時內的事件並提醒一次 */


        _checkDailyReminder() {
          const todayStr = new Date().toDateString(); // 例如 "Sun Mar 22 2026"

          const lastReminder = sys.localStorage.getItem('last_calendar_reminder'); // 如果今天已經提醒過，就不再打擾

          if (lastReminder === todayStr) return;
          const upcoming = this.getUpcomingEvents();

          if (upcoming.length > 0) {
            console.log(`[EventCalendar] 每日提醒：您今天有 ${upcoming.length} 個即將到來的事件！`); // TODO: 呼叫 UI 彈出提醒視窗

            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).bell();
            sys.localStorage.setItem('last_calendar_reminder', todayStr);
          }
        } // ── 主題設定 ──────────────────────────────────────────────────────────────


        initTheme(faction) {
          const theme = (_crd && getPageTheme === void 0 ? (_reportPossibleCrUseOfgetPageTheme({
            error: Error()
          }), getPageTheme) : getPageTheme)(faction);

          if (this.emptyLabel) {
            this.emptyLabel.color = theme.textSecondary;
          }
        } // ── 事件渲染 ──────────────────────────────────────────────────────────────


        _renderEvents() {
          if (!this.eventContainer || !this.eventCardPrefab) {
            console.warn('[EventCalendar] eventContainer 或 eventCardPrefab 未綁定');
            return;
          } // 清空舊卡片


          this.eventContainer.removeAllChildren();

          if (this._events.length === 0) {
            if (this.emptyLabel) this.emptyLabel.node.active = true;
            return;
          }

          if (this.emptyLabel) this.emptyLabel.node.active = false; // 生成事件卡片

          for (const event of this._events) {
            const card = instantiate(this.eventCardPrefab);

            this._populateCard(card, event);

            this.eventContainer.addChild(card);
          }
        }
        /** 填充事件卡片內容 */


        _populateCard(card, event) {
          var _card$getChildByName, _card$getChildByName2, _card$getChildByName3;

          // 日期標籤（例：04/06 週日 20:00）
          const dateLabel = (_card$getChildByName = card.getChildByName('DateLabel')) == null ? void 0 : _card$getChildByName.getComponent(Label);

          if (dateLabel) {
            dateLabel.string = this._formatDate(event.event_date);
          } // 標題標籤（例：第一章結算）


          const titleLabel = (_card$getChildByName2 = card.getChildByName('TitleLabel')) == null ? void 0 : _card$getChildByName2.getComponent(Label);

          if (titleLabel) {
            titleLabel.string = this._getEventIcon(event.event_type) + ' ' + event.title;
          } // 描述標籤（可選）


          const descLabel = (_card$getChildByName3 = card.getChildByName('DescLabel')) == null ? void 0 : _card$getChildByName3.getComponent(Label);

          if (descLabel && event.description) {
            descLabel.string = event.description;
          } // 高亮顯示章節結算


          if (event.event_type === 'chapter_end') {
            const bgSprite = card.getComponent(Sprite);

            if (bgSprite) {
              bgSprite.color = new Color(255, 215, 0, 50); // 金色半透明
            }
          } // 檢查是否需要提醒（事件開始前 1 小時）


          this._checkReminder(event);
        } // ── 日期格式化 ────────────────────────────────────────────────────────────


        _formatDate(isoString) {
          const date = new Date(isoString);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
          const hour = String(date.getHours()).padStart(2, '0');
          const minute = String(date.getMinutes()).padStart(2, '0');
          return `${month}/${day} 週${weekday} ${hour}:${minute}`;
        }
        /** 取得事件類型對應的 Emoji 圖標 */


        _getEventIcon(type) {
          switch (type) {
            case 'chapter_end':
              return '🏆';

            case 'maintenance':
              return '🔧';

            case 'special':
              return '🎉';

            case 'announcement':
              return '📢';

            default:
              return '📅';
          }
        } // ── 提醒功能 ──────────────────────────────────────────────────────────────

        /** 檢查是否需要發送提醒 */


        _checkReminder(event) {
          if (event.is_reminder_sent) return;
          const now = new Date();
          const eventTime = new Date(event.event_date);
          const oneHourBefore = new Date(eventTime.getTime() - 60 * 60 * 1000); // 如果當前時間在「事件開始前 1 小時」到「事件開始」之間

          if (now >= oneHourBefore && now < eventTime) {
            this._showReminder(event);

            this._markReminderSent(event.id);
          }
        }
        /** 顯示提醒彈窗 */


        _showReminder(event) {
          console.log(`[EventCalendar] 提醒：${event.title} 即將在 ${this._formatDate(event.event_date)} 開始`); // TODO: 實作提醒 Toast 或 Modal
          // 建議使用類似 RelicPoemModal 的小彈窗

          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).bell();
        }
        /** 標記提醒已發送（寫回資料庫）*/


        async _markReminderSent(eventId) {
          try {
            await fetch(`https://你的專案.supabase.co/rest/v1/td_calendar_events?id=eq.${eventId}`, {
              method: 'PATCH',
              headers: {
                'apikey': 'YOUR_ANON_KEY',
                'Authorization': 'Bearer YOUR_ANON_KEY',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                is_reminder_sent: true
              })
            });
          } catch (err) {
            console.warn('[EventCalendar] 標記提醒失敗', err);
          }
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          if (this.closeButton) {
            this.closeButton.targetOff(this);
            this.closeButton.on(Node.EventType.TOUCH_END, this._onClose, this);
          }

          if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onClose, this);
          }
        }

        _onClose() {
          tween(this.closeButton).to(0.05, {
            scale: new Vec3(0.88, 0.88, 1)
          }).to(0.05, {
            scale: Vec3.ONE
          }).call(() => {
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).panelOpen();
            this.node.emit('close-modal');
            this.node.active = false;
          }).start();
        } // ── 公開 API ──────────────────────────────────────────────────────────────

        /** 刷新事件列表（手動重新載入）*/


        async refresh() {
          await this._loadEvents();

          this._renderEvents();
        }
        /** 取得即將到來的事件（24 小時內）*/


        getUpcomingEvents() {
          const now = new Date();
          const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          return this._events.filter(event => {
            const eventTime = new Date(event.event_date);
            return eventTime >= now && eventTime <= tomorrow;
          });
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "eventContainer", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "eventCardPrefab", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "emptyLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "closeButton", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "backdropNode", [_dec6], {
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
//# sourceMappingURL=3bc6e3daf61dcf628eec0670528588a3c0c06226.js.map