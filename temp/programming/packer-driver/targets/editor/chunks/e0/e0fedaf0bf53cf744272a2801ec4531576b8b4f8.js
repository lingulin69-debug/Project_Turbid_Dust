System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, AudioClip, resources, SoundManager, _crd;

  _export("SoundManager", void 0);

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      AudioClip = _cc.AudioClip;
      resources = _cc.resources;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c75e3ADwDRK0IVVMWPiSXWk", "SoundManager", undefined);

      __checkObsolete__(['AudioClip', 'AudioSource', 'resources']);

      _export("SoundManager", SoundManager = class SoundManager {
        static init(source) {
          this._source = source;
        }

        static play(path) {
          if (!this._source) return;
          resources.load(`sounds/${path}`, AudioClip, (err, clip) => {
            if (err || !this._source) return; // 靜默處理（自動播放政策）

            this._source.playOneShot(clip);
          });
        }
        /** 公告 / 任務 / 日誌 / 圖鑑 按鈕點擊 */


        static panelOpen() {
          this.play('page_flip');
        }
        /** 鈴鐺按鈕點擊 */


        static bell() {
          this.play('bell');
        }
        /** 貨幣欄位點擊 */


        static coin() {
          this.play('coin');
        }
        /** 遺物全收集解鎖 */


        static unlock() {
          this.play('unlock');
        }
        /** 旅店治療成功 */


        static heal() {
          this.play('heal');
        }

      });

      SoundManager._source = null;

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=e0fedaf0bf53cf744272a2801ec4531576b8b4f8.js.map