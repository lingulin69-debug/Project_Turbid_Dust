import {
    _decorator,
    Component,
    Node,
    Sprite,
    Label,
    tween,
    Vec3,
    AudioSource,
    resources,
    AudioClip,
} from 'cc';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 音樂曲目資料 ──────────────────────────────────────────────────────────────

export interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    filePath: string;  // resources/music/ 下的路徑（不含副檔名）
}

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
@ccclass('MusicDiscController')
export class MusicDiscController extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 收合狀態的小按鈕 */
    @property(Node)
    toggleButton: Node = null;

    /** 展開後的面板容器 */
    @property(Node)
    panelNode: Node = null;

    /** 黑膠唱片節點（會持續旋轉）*/
    @property(Node)
    discNode: Node = null;

    /** 曲名標籤 */
    @property(Label)
    titleLabel: Label = null;

    /** 演出者標籤 */
    @property(Label)
    artistLabel: Label = null;

    /** 播放/暫停按鈕 */
    @property(Node)
    playPauseButton: Node = null;

    /** 上一首按鈕 */
    @property(Node)
    prevButton: Node = null;

    /** 下一首按鈕 */
    @property(Node)
    nextButton: Node = null;

    /** 靜音按鈕 */
    @property(Node)
    muteButton: Node = null;

    /** 靜音按鈕圖標 Sprite（需切換圖示）*/
    @property(Sprite)
    muteButtonIcon: Sprite = null;

    /** 音樂播放器（AudioSource）*/
    @property(AudioSource)
    musicPlayer: AudioSource = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _isExpanded: boolean = false;
    private _isPlaying: boolean = false;
    private _isMuted: boolean = false;
    private _currentTrackIndex: number = 0;
    private _discRotation: number = 0;  // 唱片當前旋轉角度

    /** 播放清單（從 resources/music/ 載入）*/
    private _playlist: MusicTrack[] = [
        { id: 'track_01', title: '夜幕之城',   artist: '白鴉樂團', filePath: 'music/night_city' },
        { id: 'track_02', title: '濁息之舞',   artist: '未知',     filePath: 'music/turbid_dance' },
        { id: 'track_03', title: '淨塵迴響',   artist: '純淨之聲', filePath: 'music/pure_echo' },
        { id: 'track_04', title: '天平之歌',   artist: '白鴉樂團', filePath: 'music/balance_theme' },
    ];

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._registerEvents();
        this._loadTrack(this._currentTrackIndex);
        this.panelNode.active = false;
    }

    update(dt: number): void {
        // 唱片持續旋轉（播放時）
        if (this._isPlaying && this.discNode) {
            this._discRotation += dt * 60;  // 每秒 60 度
            this.discNode.setRotationFromEuler(0, 0, -this._discRotation);
        }
    }

    onDestroy(): void {
        if (this.toggleButton?.isValid) this.toggleButton.targetOff(this);
        if (this.playPauseButton?.isValid) this.playPauseButton.targetOff(this);
        if (this.prevButton?.isValid) this.prevButton.targetOff(this);
        if (this.nextButton?.isValid) this.nextButton.targetOff(this);
        if (this.muteButton?.isValid) this.muteButton.targetOff(this);
    }

    // ── 展開/收合 ─────────────────────────────────────────────────────────────

    private _togglePanel(): void {
        this._isExpanded = !this._isExpanded;

        if (this._isExpanded) {
            this._showPanel();
        } else {
            this._hidePanel();
        }

        SoundManager.panelOpen();
    }

    private _showPanel(): void {
        this.panelNode.active = true;
        this.panelNode.setScale(Vec3.ZERO);

        tween(this.panelNode)
            .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .start();
    }

    private _hidePanel(): void {
        tween(this.panelNode)
            .to(0.15, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .call(() => {
                this.panelNode.active = false;
            })
            .start();
    }

    // ── 音樂載入 ──────────────────────────────────────────────────────────────

    private _loadTrack(index: number): void {
        if (index < 0 || index >= this._playlist.length) return;

        const track = this._playlist[index];
        this._currentTrackIndex = index;

        // 更新 UI
        if (this.titleLabel) this.titleLabel.string = track.title;
        if (this.artistLabel) this.artistLabel.string = track.artist;

       // 載入音樂檔案
        resources.load(track.filePath, AudioClip, (err, clip) => {
            if (err) {
                console.warn(`[MusicDiscController] 載入音樂失敗：${track.filePath}`, err);
                return;
            }

            if (this.musicPlayer) {
                // ✅ 重要修正：清除上一首歌遺留的結束事件，避免切歌 Bug
                this.musicPlayer.node.targetOff(this);
                
                this.musicPlayer.clip = clip;
                this.musicPlayer.loop = false;

// 重新監聽新歌的結束事件
                this.musicPlayer.node.once(AudioSource.EventType.ENDED, this._onTrackEnded, this);
            }
        });
    }

    // ── 播放控制 ──────────────────────────────────────────────────────────────

    private _togglePlayPause(): void {
        if (!this.musicPlayer || !this.musicPlayer.clip) return;

        if (this._isPlaying) {
            this._pause();
        } else {
            this._play();
        }
    }
    
    private _play(): void {
        if (!this.musicPlayer) return;

        this.musicPlayer.play();
        this._isPlaying = true;

        // 更新播放按鈕圖標（切換為「暫停」圖示）
        // TODO: 實作圖示切換
        console.log('[MusicDiscController] 播放');
    }

    private _pause(): void {
        if (!this.musicPlayer) return;

        this.musicPlayer.pause();
        this._isPlaying = false;

        // 更新播放按鈕圖標（切換為「播放」圖示）
        console.log('[MusicDiscController] 暫停');
    }

    private _playPrev(): void {
        let prevIndex = this._currentTrackIndex - 1;
        if (prevIndex < 0) prevIndex = this._playlist.length - 1;

        this._loadTrack(prevIndex);
        if (this._isPlaying) this._play();
    }

    private _playNext(): void {
        let nextIndex = this._currentTrackIndex + 1;
        if (nextIndex >= this._playlist.length) nextIndex = 0;

        this._loadTrack(nextIndex);
        if (this._isPlaying) this._play();
    }

    private _onTrackEnded(): void {
        // 自動播放下一首
        this._playNext();
    }

    // ── 靜音控制 ─────────────────────────────────────────────────────────────

    private _toggleMute(): void {
        this._isMuted = !this._isMuted;

        if (this.musicPlayer) {
            this.musicPlayer.volume = this._isMuted ? 0 : 1;
        }

        // 更新靜音按鈕圖標
        if (this.muteButtonIcon) {
            // TODO: 切換圖示（🔊 ↔ 🔇）
            // this.muteButtonIcon.spriteFrame = this._isMuted ? mutedIcon : unmutedIcon;
        }

        console.log(`[MusicDiscController] ${this._isMuted ? '靜音' : '取消靜音'}`);
    }

    // ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        if (this.toggleButton) {
            this.toggleButton.targetOff(this);
            this.toggleButton.on(Node.EventType.TOUCH_END, () => {
                tween(this.toggleButton)
                    .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
                    .to(0.05, { scale: Vec3.ONE })
                    .call(() => this._togglePanel())
                    .start();
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
    private _buttonAnimation(btn: Node, callback: () => void): void {
        tween(btn)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.08, { scale: Vec3.ONE })
            .call(() => {
                SoundManager.panelOpen();
                callback();
            })
            .start();
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /** 外部呼叫：切換播放/暫停 */
    togglePlay(): void {
        this._togglePlayPause();
    }

    /** 外部呼叫：靜音/取消靜音 */
    toggleMute(): void {
        this._toggleMute();
    }

    /** 取得當前播放狀態 */
    isPlaying(): boolean {
        return this._isPlaying;
    }

    /** 取得當前曲目資訊 */
    getCurrentTrack(): MusicTrack {
        return this._playlist[this._currentTrackIndex];
    }

    /** 設定播放清單（外部注入）*/
    setPlaylist(tracks: MusicTrack[]): void {
        if (tracks.length === 0) return;
        this._playlist = tracks;
        this._currentTrackIndex = 0;
        this._loadTrack(0);
    }
}
