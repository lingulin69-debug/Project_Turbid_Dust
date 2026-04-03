import { useEffect, useRef, useState } from "react";

const EXIT_DURATION = 150; // Aligned with modalAnimation.ts (duration-150)

export function useModalAnimation(isOpen: boolean) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  const closeTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any pending timers from previous state changes
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (isOpen) {
      // 1. Mount the component
      setShouldRender(true);

      // 2. Wait for the next frame, then the one after, to apply 'enter' class.
      // This ensures the browser has rendered the initial state before transitioning.
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // 1. Trigger exit animation
      setIsVisible(false);

      // 2. Wait for animation to finish before unmounting
      closeTimerRef.current = window.setTimeout(() => {
        setShouldRender(false);
      }, EXIT_DURATION);
    }

    // Cleanup function to clear timers if the hook's component unmounts
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isOpen]);

  return { shouldRender, isVisible };
}
