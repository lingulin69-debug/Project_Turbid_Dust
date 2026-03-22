import {
    _decorator,
    Component,
    Node,
    Vec3,
    director,
} from 'cc';
import { MapController } from './MapController';
import { HUDController, HUDPanelId } from './HUDController';
import { DataManager, ItemData } from './PTD_DataManager';
import { InventoryPanel } from './InventoryPanel';
import { ItemDetailModal } from './ItemDetailModal';
import { NPCModal, NpcId } from './NPCModal';
import { SoundManager } from './SoundManager';
import { DiceResultOverlay, DiceResult } from './DiceResultOverlay';
import { RelicPoemModal } from './RelicPoemModal';
import { WhiteCrowCard } from './WhiteCrowCard';
import { ChapterStoryModal } from './ChapterStoryModal';
import { DonationTracker } from './DonationTracker';
import { EventCalendar } from './EventCalendar';
import { MusicDiscController } from './MusicDiscController';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('MainGameController')
export class MainGameController extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 地圖總管 */
    @property(MapController)
    mapController: MapController = null;

    /** HUD 總管 */
    @property(HUDController)
    hudController: HUDController = null;

    /** 固定 NPC 節點（黑心商人 / 旅店老闆 / 寵物商人 / 道具商人）
     *  ⚠️ 節點名稱必須與 npc_role 欄位值完全一致，如 'inn_owner', 'black_merchant'
     */
    @property([Node])
    fixedNpcNodes: Node[] = [];

    /** 移動 NPC：人販子（節點名稱需設為 'trafficker'）*/
    @property(Node)
    traffickerNode: Node = null;

    /** 背包面板 */
    @property(InventoryPanel)
    inventoryPanel: InventoryPanel = null;

    /** 道具詳情 Modal */
    @property(ItemDetailModal)
    itemDetailModal: ItemDetailModal = null;

    /** NPC 互動 Modal */
    @property(NPCModal)
    npcModal: NPCModal = null;

    /** D20 擲骰結果覆蓋層 */
    @property(DiceResultOverlay)
    diceOverlay: DiceResultOverlay = null;

    /** 遺物詩歌彈窗 */
    @property(RelicPoemModal)
    relicPoemModal: RelicPoemModal = null;

    /**
     * 白鴉卡片組件節點（用於監聽 'show-relic-poem' 彩蛋事件）。
     * ⚠️ 請將場景中掛有 WhiteCrowCard 組件的節點拖入此插座。
     */
    @property(WhiteCrowCard)
    whiteCrowCard: WhiteCrowCard = null;

    /** 章節劇情彈窗 */
    @property(ChapterStoryModal)
    chapterStoryModal: ChapterStoryModal = null;

    /** 捐獻追蹤器 */
    @property(DonationTracker)
    donationTracker: DonationTracker = null;

    /** 企劃日曆 */
    @property(EventCalendar)
    eventCalendar: EventCalendar = null;

    /** 音樂磁片控制器 */
    @property(MusicDiscController)
    musicDiscController: MusicDiscController = null;



    // ── 私有狀態 (章節與遊戲階段) ─────────────────────────────────────────────
    
    private _gamePhase: 'battle' | 'story' | 'transition' = 'battle';
    private _currentChapter: number = 1;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._registerEvents();
        this._registerNpcEvents();
        this._registerRelicEvents();
        this.initNPCs();
    }

async start(): Promise<void> {
        // 🛡️ 登入守衛：防止玩家繞過登入畫面
    if (!DataManager.getPlayer()) {
        console.warn('[MainGameController] 尚未登入，重新導向登入場景');
        director.loadScene('LoginScene');  // ⚠️ 確認你的登入場景名稱
        return;
    }
    
        await this._loadInventory();
        await this._initGameState();   // <-- 新增：啟動時取得伺服器最新章節狀態
        this._startRealtimeListener(); // <-- 新增：開始 60 秒輪詢

        // 👇 新增這兩行：喚醒新組件 👇
        if (this.donationTracker) this.donationTracker.initForChapter(this._currentChapter);
        if (this.eventCalendar) this.eventCalendar.refresh();
        // 👆 ──────────────────── 👆
    }

    onDestroy(): void {
        this.mapController?.node.off('landmark-selected', this._onLandmarkSelected, this);
        this.hudController?.node.off('panel-open', this._onPanelOpen, this);
        this.inventoryPanel?.node.off('show-item-detail', this._onShowItemDetail, this);
        this.itemDetailModal?.node.off('use-item', this._onUseItem, this);
        this.npcModal?.node.off('npc-action', this._onNpcAction, this);
        this.npcModal?.node.off('buy-item',   this._onBuyItem,   this);
        this.whiteCrowCard?.node.off('show-relic-poem', this._onShowRelicPoem, this);
        this._unregisterNpcEvents();
        
        this._stopRealtimeListener();  // <-- 新增：記得關閉輪詢
    }

    // ── 事件串接：地圖與 HUD ──────────────────────────────────────────────────

    private _registerEvents(): void {
        if (!this.mapController) {
            console.warn('[MainGameController] mapController 未綁定');
            return;
        }
        if (!this.hudController) {
            console.warn('[MainGameController] hudController 未綁定');
            return;
        }

        this.mapController.node.on('landmark-selected', this._onLandmarkSelected, this);
        this.hudController.node.on('panel-open', this._onPanelOpen, this);
    }

    private _onLandmarkSelected(landmarkId: string): void {
        console.log(`[MainGameController] 準備開啟據點 ${landmarkId} 劇情`);
        // TODO：呼叫劇情 Modal，傳入 landmarkId
    }

    private _onPanelOpen(panelId: HUDPanelId): void {
        console.log(`[MainGameController] 準備開啟 ${panelId} 面板`);
        // TODO：顯示對應面板節點
    }

    // ── 事件串接：NPC 點擊 ────────────────────────────────────────────────────

    /**
     * 為所有 NPC 節點綁定點擊事件。
     * 節點名稱（node.name）即為 npcId，須與 CLAUDE.md npc_role 欄位值一致。
     */
    private _registerNpcEvents(): void {
        const npcNodes: Node[] = [
            ...this.fixedNpcNodes.filter(n => !!n),
        ];
        if (this.traffickerNode) npcNodes.push(this.traffickerNode);

        for (const npcNode of npcNodes) {
            npcNode.targetOff(this);
            npcNode.on(Node.EventType.TOUCH_END, () => this._onNpcNodeTap(npcNode), this);
        }

        // NPC 行動事件（由 NPCModal 廣播，主場景處理業務邏輯）
        if (this.npcModal) {
            this.npcModal.node.targetOff(this);
            this.npcModal.node.on('npc-action', this._onNpcAction, this);
            this.npcModal.node.on('buy-item',   this._onBuyItem,   this);
        }
    }

    private _unregisterNpcEvents(): void {
        const npcNodes: Node[] = [
            ...this.fixedNpcNodes.filter(n => !!n),
        ];
        if (this.traffickerNode) npcNodes.push(this.traffickerNode);
        for (const npcNode of npcNodes) npcNode.targetOff(this);
    }

    private _onNpcNodeTap(npcNode: Node): void {
        if (!this.npcModal) {
            console.warn('[MainGameController] npcModal 未綁定');
            return;
        }

        SoundManager.panelOpen();
        // node.name 即為 npcId（美術設定節點名稱時需遵守此命名規則）
        this.npcModal.init(npcNode.name as NpcId);
    }

    // ── NPC 行動業務邏輯 ──────────────────────────────────────────────────────

    private _onNpcAction(npcId: NpcId): void {
        switch (npcId) {
            case 'inn_owner':
                this._handleInnHeal();
                break;
            default:
                console.log(`[MainGameController] npc-action 未處理的 npcId：${npcId}`);
                break;
        }
    }

    private _onBuyItem(item: ItemData): void {
        const result = DataManager.purchaseItem(item);

        if (!result.success) {
            console.log(`[MainGameController] 金幣不足：${item.name}`);
            return;
        }

        SoundManager.coin();
        console.log(`[MainGameController] ${result.message}`);

        // TODO：呼叫 POST /api/inventory/buy，傳入 item.id，後端寫入資料庫

        // 即時刷新背包顯示
        if (this.inventoryPanel) {
            this.inventoryPanel.init([...DataManager.getInventory()]);
        }
    }

    // ── 遺物詩歌彩蛋 ──────────────────────────────────────────────────────────

    private _registerRelicEvents(): void {
        if (!this.whiteCrowCard) return;
        this.whiteCrowCard.node.on('show-relic-poem', this._onShowRelicPoem, this);
    }

    private _onShowRelicPoem(): void {
        if (!this.relicPoemModal) {
            console.warn('[MainGameController] relicPoemModal 未綁定');
            return;
        }

        // 「昔日的餘溫」全收集解鎖詩篇
        // 詩歌文字在此定義，保持 RelicPoemModal 可複用
        const poem =
            '灰燼尚存一息暖，\n' +
            '記憶比塵更難散。\n' +
            '白鴉銜著舊時光，\n' +
            '落在無人問津的岸。';
        const author = '── 無名者手稿，殘頁';

        this.relicPoemModal.init(poem, author);
    }

    private _handleInnHeal(): void {
        const player = DataManager.getPlayer();
        const HEAL_COST  = 2;
        const HEAL_AMOUNT = 10;
        const DICE_TARGET = 10;

        if (!player || player.coins < HEAL_COST) {
            console.log('[MainGameController] 金幣不足，無法休息');
            return;
        }

        if (!this.diceOverlay) {
            console.warn('[MainGameController] diceOverlay 未綁定');
            return;
        }

        DataManager.updateCoins(-HEAL_COST);

        // 單次監聽，避免重複觸發
        this.diceOverlay.node.once('dice-finished', (result: DiceResult) => {
            if (result.success) {
                DataManager.updateHP(HEAL_AMOUNT);
                // TODO：換用 SoundManager.heal() 當音效建立後
                SoundManager.panelOpen();
                console.log(`[MainGameController] 擲出 ${result.rollResult}，治療成功，恢復 ${HEAL_AMOUNT} HP`);
            } else {
                console.log(`[MainGameController] 擲出 ${result.rollResult}，治療失敗`);
            }
        });

        this.diceOverlay.rollDice(DICE_TARGET);
    }

    // ── 背包 ──────────────────────────────────────────────────────────────────

    private async _loadInventory(): Promise<void> {
        if (!this.inventoryPanel) return;

        const items = await DataManager.fetchInventory();
        this.inventoryPanel.init(items);

        if (this.inventoryPanel) {
            this.inventoryPanel.node.targetOff(this);
            this.inventoryPanel.node.on('show-item-detail', this._onShowItemDetail, this);
        }

        if (this.itemDetailModal) {
            this.itemDetailModal.node.targetOff(this);
            this.itemDetailModal.node.on('use-item', this._onUseItem, this);
        }
    }

    private _onShowItemDetail(data: ItemData): void {
        if (!this.itemDetailModal) return;
        this.itemDetailModal.init(data);
    }

    private async _onUseItem(data: ItemData): Promise<void> {
        console.log(`[MainGameController] 呼叫 API：消耗道具 ${data.name}`);
        // TODO：呼叫 POST /api/inventory/use，傳入 data.id

        // 使用後刷新背包
        await this._loadInventory();
    }

    // ── NPC 佈署 ──────────────────────────────────────────────────────────────

    /**
     * 初始化所有 NPC 的顯示狀態與位置。
     * 固定 NPC 座標由美術於編輯器設定，此處只確保啟用。
     * 移動 NPC（人販子）依玩家當前據點動態定位。
     */
    initNPCs(): void {
        this._initFixedNpcs();
        this._initTrafficker();
    }

    private _initFixedNpcs(): void {
        for (const npcNode of this.fixedNpcNodes) {
            if (npcNode) npcNode.active = true;
        }
    }

    private _initTrafficker(): void {
        if (!this.traffickerNode) return;

        const player = DataManager.getPlayer();
        const landmarkId = player?.current_landmark_id;

        if (!landmarkId || !this.mapController) {
            this.traffickerNode.active = false;
            return;
        }

        const worldPos = this.mapController.getLandmarkWorldPos(landmarkId);
        if (!worldPos) {
            this.traffickerNode.active = false;
            return;
        }

        // 微調偏移：x+3, y-4（避免與據點圖標完全重疊）
        this.traffickerNode.setWorldPosition(
            new Vec3(worldPos.x + 3, worldPos.y - 4, 0),
        );
        this.traffickerNode.active = true;
    }

// ── 章節與遊戲狀態管理 (新增區塊) ───────────────────────────────────────────

    private async _initGameState(): Promise<void> {
        const state = await DataManager.fetchGameState();
        if (state) {
            this._currentChapter = state.current_chapter;
            this._gamePhase = state.phase;
            this._handlePhaseChange(this._gamePhase);
        }
    }

    private _startRealtimeListener(): void {
        // 每 60 秒輪詢一次，節省效能與 API 額度
        this.schedule(this._pollGameState, 60.0);
    }

    private _stopRealtimeListener(): void {
        this.unschedule(this._pollGameState);
    }

    private async _pollGameState(): Promise<void> {
        const state = await DataManager.fetchGameState();
        if (state) {
            if (state.phase !== this._gamePhase) {
                this._gamePhase = state.phase;
                this._currentChapter = state.current_chapter;
                this._handlePhaseChange(state.phase);
            }
        }
    }

    private _handlePhaseChange(phase: 'battle' | 'story' | 'transition'): void {
        switch (phase) {
            case 'battle':
                this._loadNewChapter(this._currentChapter);
                this._hideStoryButton();
                // 新章節開始時，重置本週捐獻次數
                if (this.donationTracker) this.donationTracker.resetForNewChapter(this._currentChapter);
                break;
            case 'story':
                this._showStoryButton(this._currentChapter);
                this._lockLandmarks();
                break;
            case 'transition':
                this._showWaitingScreen();
                break;
        }
    }

    // (這裡接續你原本的 private _showStoryButton ...)

    private _showStoryButton(chapterNumber: number): void {
        if (!this.hudController) return;
        this.hudController.showChapterStoryButton(chapterNumber);
        
        // 綁定 HUD 發出的點擊事件
        this.hudController.node.once('chapter-story-click', () => {
            this._playChapterStory(chapterNumber);
        });
    }

    private _hideStoryButton(): void {
        if (this.hudController) {
            this.hudController.hideChapterStoryButton();
        }
    }

    private async _playChapterStory(chapterNumber: number): Promise<void> {
        const story = await DataManager.fetchChapterStory(chapterNumber);
        if (!story) {
            console.warn('[MainGameController] 找不到章節劇情');
            return;
        }

        if (this.chapterStoryModal) {
            this.chapterStoryModal.init({
                chapter: chapterNumber,
                title: story.title,
                content: story.content,
                bgImageUrl: story.bg_image_url,
                bgMusicUrl: story.bg_music_url,
                winnerFaction: story.winner_faction
            });
            this.chapterStoryModal.node.active = true;
        }

        this._markStoryWatched(chapterNumber);
    }

    private async _loadNewChapter(chapterNumber: number): Promise<void> {
        console.log(`[MainGameController] 準備載入第 ${chapterNumber} 章地圖 (待實作 DataManager 串接)`);
        // TODO: 呼叫 DataManager 取得新章節據點並傳給 mapController
    }

    private _lockLandmarks(): void {
        if (!this.mapController) return;
        
        const landmarkIds = this.mapController.landmarkIds;
        for (const id of landmarkIds) {
            const landmark = this.mapController.getLandmark(id);
            if (landmark) {
                const oldData = (landmark as any)['_data']; 
                if (oldData) {
                    // 讓據點變成灰色關閉狀態，而不是直接消失
                    landmark.init({ ...oldData, status: 'closed' });
                }
            }
        }
    }

    private _showWaitingScreen(): void {
        console.log('[MainGameController] 等待新章節開始');
        // TODO: 實作等待畫面 UI
    }

    private _markStoryWatched(chapterNumber: number): void {
        console.log(`[MainGameController] 玩家已觀看第 ${chapterNumber} 章劇情`);
    }
}
