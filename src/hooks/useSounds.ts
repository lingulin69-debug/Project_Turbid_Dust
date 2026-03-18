/**
 * PTD 音效系統
 * 音效檔放置於 /public/sounds/
 * 設計師提供素材後替換對應路徑的檔案即可生效
 */

const audioCache: Record<string, HTMLAudioElement> = {};

function playSound(src: string, volume = 0.6) {
  try {
    if (!audioCache[src]) {
      audioCache[src] = new Audio(src);
    }
    const audio = audioCache[src];
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {
      // 瀏覽器自動播放政策限制時靜默失敗（使用者互動後才會觸發）
    });
  } catch {
    // 音效播放失敗不影響功能
  }
}

export const Sounds = {
  /** 紙質翻頁聲（公告/任務/日誌/圖鑑面板開啟） */
  panelOpen: () => playSound('/sounds/page_flip.mp3', 0.5),

  /** 鈴鐺聲（通知鈴鐺點擊） */
  bell: () => playSound('/sounds/bell.mp3', 0.6),

  /** 錢幣聲（貨幣顯示點擊） */
  coin: () => playSound('/sounds/coin.mp3', 0.55),
} as const;
