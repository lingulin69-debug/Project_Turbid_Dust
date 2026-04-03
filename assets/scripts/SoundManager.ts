import { AudioClip, AudioSource, resources } from 'cc';

export class SoundManager {
    private static _source: AudioSource | null = null;
    private static _bgmSource: AudioSource | null = null;
    private static _bgmVolume: number = 1.0;
    private static _sfxVolume: number = 1.0;

    static init(source: AudioSource): void {
        this._source = source;
    }

    /** 初始化 BGM 專用 AudioSource（需獨立於 SFX） */
    static initBgm(bgmSource: AudioSource): void {
        this._bgmSource = bgmSource;
        this._bgmSource.loop = true;
        this._bgmSource.volume = this._bgmVolume;
    }

    static play(path: string): void {
        if (!this._source) return;
        resources.load(`sounds/${path}`, AudioClip, (err, clip) => {
            if (err || !this._source) return;  // 靜默處理（自動播放政策）
            this._source.playOneShot(clip, this._sfxVolume);
        });
    }

    /** 設定背景音樂音量（0.0 ~ 1.0） */
    static setBgmVolume(v: number): void {
        this._bgmVolume = Math.max(0, Math.min(1, v));
        if (this._bgmSource) {
            this._bgmSource.volume = this._bgmVolume;
        }
    }

    /** 設定音效音量（0.0 ~ 1.0） */
    static setSfxVolume(v: number): void {
        this._sfxVolume = Math.max(0, Math.min(1, v));
    }

    /** 取得目前 BGM 音量 */
    static getBgmVolume(): number { return this._bgmVolume; }

    /** 取得目前 SFX 音量 */
    static getSfxVolume(): number { return this._sfxVolume; }

    /** 公告 / 任務 / 日誌 / 圖鑑 按鈕點擊 */
    static panelOpen(): void { this.play('page_flip'); }

    /** 鈴鐺按鈕點擊 */
    static bell(): void { this.play('bell'); }

    /** 貨幣欄位點擊 */
    static coin(): void { this.play('coin'); }

    /** 遺物全收集解鎖 */
    static unlock(): void { this.play('unlock'); }

    /** 旅店治療成功 */
    static heal(): void { this.play('heal'); }
}
