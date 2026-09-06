import { useState, useEffect } from 'react';

// rAF count-up hook per design_react.md §9 (700-800ms easeOutCubic: 1 - (1-p)^3)
export const useCountUp = (target: number, duration: number = 750): number => {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const startVal = 0;
    const endVal = target;

    if (isNaN(endVal) || endVal === 0) {
      setCurrent(0);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startVal + (endVal - startVal) * ease);

      setCurrent(val);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return current;
};
