import React, { useEffect, useRef } from 'react';

/**
 * GlitchGhost 特效組件
 * 用於 Scene_Ruins (空衣街區) 的靈魂閃爍效果
 */
export const GlitchGhost: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeoutId: NodeJS.Timeout;

    const renderGhost = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 隨機產生人影座標
      const x = Math.random() * (width - 50);
      const y = Math.random() * (height - 150);

      // 繪製透明人影遮罩 (簡化為人體輪廓矩形)
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      
      // 繪製人影形狀 (頭部與身體)
      ctx.beginPath();
      ctx.arc(x + 25, y + 25, 20, 0, Math.PI * 2); // 頭
      ctx.fill();
      ctx.fillRect(x + 5, y + 50, 40, 80); // 身體
      
      // 0.5 秒後消失
      setTimeout(() => {
        ctx.clearRect(0, 0, width, height);
      }, 500);

      // 隨機間隔 10-30 秒再次觸發
      const nextInterval = (Math.random() * 20 + 10) * 1000;
      timeoutId = setTimeout(renderGhost, nextInterval);
    };

    // 初始觸發
    timeoutId = setTimeout(renderGhost, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        filter: 'blur(2px)'
      }}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
};

/**
 * 空衣街區背景容器
 * 包含低飽和度濾鏡與靜態資產渲染
 */
export const SceneRuinsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div 
      className="scene-ruins"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        filter: 'saturate(0.8)', // 飽和度降低 20%
        overflow: 'hidden'
      }}
    >
      {/* 渲染保持人體姿態的空衣物資產 (示意圖層) */}
      <div className="empty-clothes-layer" style={{ opacity: 0.6 }}>
        {/* 此處將渲染 AI 生成的空衣物資產 */}
      </div>

      {/* 靈魂閃爍特效 */}
      <GlitchGhost />

      {children}
    </div>
  );
};
