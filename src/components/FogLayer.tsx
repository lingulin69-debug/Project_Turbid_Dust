import React, { useEffect, useState } from 'react';

type FogLayerProps = {
  active: boolean;
  dispersing: boolean;
  onDisperseEnd?: () => void;
  className?: string;
};

export const FogLayer: React.FC<FogLayerProps> = ({
  active,
  dispersing,
  onDisperseEnd,
  className
}) => {
  const [visible, setVisible] = useState(active);
  const [opacity, setOpacity] = useState(active ? 0.6 : 0);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setOpacity(0.6);
    } else {
      setOpacity(0);
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [active]);

  useEffect(() => {
    if (!visible) return;
    if (dispersing) {
      setOpacity(0);
      const t = setTimeout(() => {
        setVisible(false);
        onDisperseEnd && onDisperseEnd();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [dispersing, visible, onDisperseEnd]);

  if (!visible) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none mix-blend-multiply ${className || ''}`}
      style={{
        zIndex: 40,
        transition: 'opacity 600ms ease',
        opacity
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/35 to-black/50 backdrop-blur-[2px]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_20%_30%,#ffffff_0%,transparent_40%),radial-gradient(circle_at_80%_70%,#ffffff_0%,transparent_45%)] animate-pulse" />
    </div>
  );
};

export default FogLayer;
