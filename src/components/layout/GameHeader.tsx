import React from 'react';

interface GameHeaderProps {
  playerName?: string;
  faction?: 'Turbid' | 'Pure' | 'Common';
  coins?: number;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
  isAdmin?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  playerName,
  faction = 'Common',
  coins = 0,
  unreadNotifications = 0,
  onNotificationClick,
  isAdmin = false,
}) => {
  // 陣營色碼（來自 CLAUDE.md）
  const factionColors = {
    Turbid: { bg: '#211a2e', highlight: '#7c3aed', text: 'text-purple-400' },
    Pure: { bg: '#ede6ce', highlight: '#d4af37', text: 'text-yellow-600' },
    Common: { bg: '#0a0a0f', highlight: '#888888', text: 'text-gray-400' },
  };

  const current = factionColors[faction];

  return (
    <header
      className="w-full h-16 backdrop-blur-sm bg-black/20 border-b border-white/5 md:scale-100 scale-90 origin-top"
      style={{
        backgroundColor: `${current.bg}dd`,
        borderColor: current.highlight,
      }}
    >
      <div className="w-full h-full flex items-center justify-between px-4 md:px-6">
        {/* 左側：玩家信息 */}
        <div className="flex items-center gap-4">
          <div>
            <p className={`text-sm font-medium ${current.text}`}>{playerName || '未登入'}</p>
            <p className="text-xs text-gray-500">
              {faction === 'Turbid' && '濁息者'}
              {faction === 'Pure' && '淨塵者'}
              {faction === 'Common' && '旅人'}
              {isAdmin && ' · 管理員'}
            </p>
          </div>
        </div>

        {/* 右側：資源 & 通知 */}
        <div className="flex items-center gap-6">
          {/* 貨幣顯示 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">💰</span>
            <span className="font-semibold">{coins}</span>
          </div>

          {/* 通知圖標 */}
          {unreadNotifications > 0 && (
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded hover:bg-white/10 transition"
            >
              <span className="text-lg">🔔</span>
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unreadNotifications}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
