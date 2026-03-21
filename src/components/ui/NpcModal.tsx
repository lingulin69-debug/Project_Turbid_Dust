import React from 'react';

interface NpcModalProps {
  npc: {
    id: string;
    oc_name: string;
    display_name: string;
    npc_role: 'black_merchant' | 'trafficker' | 'inn_owner' | 'pet_merchant';
    greeting: string;
  } | null;
  onClose: () => void;
}

const NPC_ICONS: Record<string, string> = {
  black_merchant: '🎭',
  trafficker: '🪤',
  inn_owner: '🏠',
  pet_merchant: '🐾',
};

const NPC_LABELS: Record<string, string> = {
  black_merchant: '黑心商人',
  trafficker: '人販子',
  inn_owner: '旅店老闆',
  pet_merchant: '寵物商人',
};

/**
 * NpcModal — NPC 交互彈窗
 * 
 * 桌機端：右側 Side Panel
 * 手機端：底部 Drawer
 */
export const NpcModal: React.FC<NpcModalProps> = ({ npc, onClose }) => {
  if (!npc) return null;

  return (
    <>
      {/* 背景遮罩（全屏） */}
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={onClose}
      />

      {/* 手機端：底部抽屜 */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
        <div
          className="bg-black/60 backdrop-blur-md rounded-t-[6px] border-t border-white/10 p-6 space-y-4"
        >
          {/* 頭部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{NPC_ICONS[npc.npc_role]}</span>
              <div>
                <p className="text-lg font-bold text-white">{npc.display_name}</p>
                <p className="text-xs text-gray-400">{NPC_LABELS[npc.npc_role]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* 對話文本 */}
          <div className="bg-white/5 border border-white/10 rounded-[6px] p-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              「{npc.greeting}」
            </p>
          </div>

          {/* 操作按鈕群 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-[6px] text-white text-sm transition"
            >
              離開
            </button>
            <button
              className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-[6px] text-white text-sm transition"
            >
              互動
            </button>
          </div>
        </div>
      </div>

      {/* 桌機端：右側 Side Panel */}
      <div className="hidden md:fixed md:right-0 md:top-0 md:h-screen md:z-50 md:w-80">
        {/* 背景遮罩 */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />

        {/* 面板容器 */}
        <div className="relative h-full bg-black/60 backdrop-blur-md border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] p-6 overflow-y-auto">
          {/* 頭部 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{NPC_ICONS[npc.npc_role]}</span>
              <div>
                <p className="text-xl font-bold text-white">{npc.display_name}</p>
                <p className="text-xs text-gray-400">{NPC_LABELS[npc.npc_role]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* 分隔線 */}
          <div className="w-full h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0 mb-6" />

          {/* 對話文本 */}
          <div className="bg-white/5 border border-white/10 rounded-[6px] p-4 mb-6">
            <p className="text-sm text-gray-300 leading-relaxed">
              「{npc.greeting}」
            </p>
          </div>

          {/* 操作按鈕群 */}
          <div className="space-y-3">
            <button
              className="w-full px-4 py-3 bg-purple-700 hover:bg-purple-600 rounded-[6px] text-white text-sm font-medium transition"
            >
              互動
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-[6px] text-white text-sm font-medium transition"
            >
              離開
            </button>
          </div>

          {/* 底部留白 */}
          <div className="mt-8 text-xs text-gray-500 text-center">
            {npc.oc_name}
          </div>
        </div>
      </div>
    </>
  );
};
