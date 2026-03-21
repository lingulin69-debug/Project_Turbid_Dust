import { AudioClip, AudioSource, resources } from 'cc';

export class SoundManager {
    private static _source: AudioSource | null = null;

    static init(source: AudioSource): void {
        this._source = source;
    }

    static play(path: string): void {
        if (!this._source) return;
        resources.load(`sounds/${path}`, AudioClip, (err, clip) => {
            if (err || !this._source) return;  // 靜默處理（自動播放政策）
            this._source.playOneShot(clip);
        });
    }

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
