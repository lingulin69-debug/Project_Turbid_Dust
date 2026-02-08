import { useState, useEffect, useCallback } from 'react';

/**
 * 答邏之歌 (Song of Dalo) 音頻系統
 * 負責處理動態音軌切換、儀式感解鎖與結局演出
 */

export type AudioChapter = 1 | 2 | 3 | 4 | 'ending';

interface AudioState {
  currentTrack: string;
  volume: number;
  isMuted: boolean;
  isEndingCredits: boolean;
}

export const useSongOfDalo = () => {
  const [state, setState] = useState<AudioState>({
    currentTrack: '',
    volume: 1,
    isMuted: false,
    isEndingCredits: false,
  });

  // 音軌映射表：根據章節切換不同版本的「答邏之歌」
  const trackMap: Record<AudioChapter, string> = {
    1: '/audio/song_of_dalo_pure_flute.mp3',      // 純笛聲
    2: '/audio/song_of_dalo_echo.mp3',            // 帶有回聲
    3: '/audio/song_of_dalo_distorted.mp3',       // 失真混響
    4: '/audio/song_of_dalo_shattered.mp3',       // 破碎感
    'ending': '/audio/song_of_dalo_full_ver.mp3', // 完整版
  };

  /**
   * 儀式感解鎖：當收集到《斷裂的木笛》時觸發
   */
  const triggerFluteRitual = useCallback(async () => {
    // 1. 靜音 3 秒
    setState(prev => ({ ...prev, isMuted: true }));
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. 播放第一章主題旋律
    setState(prev => ({ 
      ...prev, 
      isMuted: false, 
      currentTrack: trackMap[1] 
    }));
    
    console.log('儀式感解鎖：聽見了憂傷的笛聲主題。');
  }, []);

  /**
   * 切換章節音軌
   */
  const switchChapterAudio = (chapter: AudioChapter) => {
    setState(prev => ({
      ...prev,
      currentTrack: trackMap[chapter],
      isEndingCredits: chapter === 'ending'
    }));
  };

  /**
   * 結局演出：自動播放完整版並準備歌詞捲動
   */
  const startEndingPerformance = () => {
    switchChapterAudio('ending');
    setState(prev => ({ ...prev, isEndingCredits: true }));
    // 這裡可以觸發前端歌詞捲動組件的顯示邏輯
  };

  return {
    ...state,
    triggerFluteRitual,
    switchChapterAudio,
    startEndingPerformance,
    lyrics: [
      "當光芒垂落於白鴉之翼",
      "繩索斷裂在無聲的嘆息",
      "你在繭中數著萬年的孤寂",
      "我在霧中找尋破碎的蹤跡...",
      // ... 更多歌詞
    ]
  };
};
