import {
    _decorator,
    Color,
    Component,
    Label,
    Node,
    tween,
    Vec3,
} from 'cc';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 擲骰結果資料 ──────────────────────────────────────────────────────────────

export interface DiceResult {
    success:    boolean;
    rollResult: number;
}

// ── 常數 ──────────────────────────────────────────────────────────────────────

const ROLL_INTERVAL   = 0.05;  // 數字跳動頻率（秒）
const ROLL_DURATION   = 0.6;   // 跳動持續時間（秒）
const RESULT_HOLD     = 1.2;   // 結果停留時間（秒）

const COLOR_SUCCESS = new Color(100, 220, 120, 255);  // 綠色系
const COLOR_FAILURE = new Color(220,  80,  80, 255);  // 紅色系

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('DiceResultOverlay')
export class DiceResultOverlay extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 跳動數字與最終點數 */
    @property(Label)
    diceNumberLabel: Label = null;

    /** 大字「成功」或「失敗」 */
    @property(Label)
    resultTextLabel: Label = null;

    /** 整體視覺容器（active 控制顯示/隱藏）*/
    @property(Node)
    overlayNode: Node = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _rolling: boolean = false;

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /**
     * 觸發一次 D20 擲骰流程。
     * 建議由 MainGameController._handleInnHeal() 等業務邏輯呼叫。
     *
     * @param targetValue  成功門檻（骰出 >= targetValue 即成功）
     * @param hasAdvantage 優勢擲骰：投兩次取高者
     */
    rollDice(targetValue: number, hasAdvantage: boolean = false): void {
        if (this._rolling) return;
        this._rolling = true;

        // 顯示容器，隱藏結果文字
        if (this.overlayNode)    this.overlayNode.active    = true;
        if (this.resultTextLabel) this.resultTextLabel.node.active = false;

        // 背景計算最終結果
        const finalNumber = hasAdvantage
            ? Math.max(this._d20(), this._d20())
            : this._d20();
        const isSuccess = finalNumber >= targetValue;

        // 啟動跳動動畫
        let elapsed = 0;
        this.schedule(function (this: DiceResultOverlay) {
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
    }

    // ── 私有方法 ──────────────────────────────────────────────────────────────

    /** 產生 1–20 的隨機整數 */
    private _d20(): number {
        return Math.floor(Math.random() * 20) + 1;
    }

    private _showResult(finalNumber: number, isSuccess: boolean): void {
        // 鎖定點數
        if (this.diceNumberLabel) {
            this.diceNumberLabel.string = `${finalNumber}`;
        }

        // TODO：換用 SoundManager.diceRoll() 當骰子音效建立後
        SoundManager.panelOpen();

        // 結果標籤
        if (this.resultTextLabel) {
            this.resultTextLabel.string = isSuccess ? '成功' : '失敗';
            this.resultTextLabel.color  = isSuccess ? COLOR_SUCCESS : COLOR_FAILURE;
            this.resultTextLabel.node.active = true;
            this.resultTextLabel.node.setScale(Vec3.ZERO);

            tween(this.resultTextLabel.node)
                .to(0.12, { scale: new Vec3(1.25, 1.25, 1) })
                .to(0.08, { scale: Vec3.ONE })
                .start();
        }

        // 停留後收起並廣播結果
        this.scheduleOnce(() => {
            this._rolling = false;
            if (this.overlayNode) this.overlayNode.active = false;

            const result: DiceResult = { success: isSuccess, rollResult: finalNumber };
            this.node.emit('dice-finished', result);
        }, RESULT_HOLD);
    }
}
