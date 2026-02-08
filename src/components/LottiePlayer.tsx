import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

interface LottiePlayerProps {
  animationData: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
  onComplete?: () => void;
  /**
   * 播放模式：'normal' 為普通播放，'frame' 為手動控制幀數
   */
  mode?: 'normal' | 'frame';
}

export interface LottiePlayerHandle {
  goToAndStop: (value: number, isFrame?: boolean) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
}

const LottiePlayer = forwardRef<LottiePlayerHandle, LottiePlayerProps>(
  ({ animationData, loop = true, autoplay = true, className, style, speed = 1, onComplete, mode = 'normal' }, ref) => {
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useImperativeHandle(ref, () => ({
      goToAndStop: (value: number, isFrame = true) => {
        lottieRef.current?.goToAndStop(value, isFrame);
      },
      play: () => {
        lottieRef.current?.play();
      },
      pause: () => {
        lottieRef.current?.pause();
      },
      setSpeed: (s: number) => {
        lottieRef.current?.setSpeed(s);
      }
    }));

    useEffect(() => {
      if (lottieRef.current) {
        lottieRef.current.setSpeed(speed);
      }
    }, [speed]);

    return (
      <div className={className} style={{ width: '100%', height: '100%', ...style }}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          onComplete={onComplete}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }
);

LottiePlayer.displayName = 'LottiePlayer';

export default LottiePlayer;
