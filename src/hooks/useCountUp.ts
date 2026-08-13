import { useEffect, useRef, useState } from "react";

/** Ease-out cubic — fast départ, long settle. Matches --ease-out closely
 * enough that a counting number and a moving card feel like one gesture. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates 0 → `target` over `duration` ms.
 *
 * Returns the target immediately (no animation) when the user has asked for
 * reduced motion, so the number is still correct and readable.
 */
export function useCountUp(target: number, duration = 800, enabled = true): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || duration <= 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(target * easeOut(progress));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, enabled]);

  return value;
}
