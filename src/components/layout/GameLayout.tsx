import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-[#0a0a0a]">
      {/* 主容器：桌機 max-w-[1440px] 居中，手機滿版；兩側邊界 + 陰影 */}
      <div className="mx-auto max-w-[1440px] w-full md:border-x md:border-white/5 md:shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        {/* 內容區域 */}
        <main className="py-4 md:py-6 px-4 md:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* 手機版底部導覽列（md 以上隱藏） */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-900 border-t border-slate-700 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {/* 導覽項目由父組件或路由層管理 */}
          <div className="w-12 h-12 flex items-center justify-center text-gray-400">
            {/* 佔位符 */}
          </div>
          <div className="w-12 h-12 flex items-center justify-center text-gray-400">
            {/* 佔位符 */}
          </div>
          <div className="w-12 h-12 flex items-center justify-center text-gray-400">
            {/* 佔位符 */}
          </div>
          <div className="w-12 h-12 flex items-center justify-center text-gray-400">
            {/* 佔位符 */}
          </div>
        </div>
      </nav>

      {/* 手機版時的內容底部留白（防止底部導覽遮擋） */}
      <div className="h-16 md:h-0" />
    </div>
  );
};
