import { useEffect, useRef, useState } from "react";

// Eases a displayed number toward `target`, starting from wherever it
// currently is — so values count up on first paint and glide on later
// changes. `delay` only applies to the first run (for staggering a row of
// cards). Jumps straight to the target when the user prefers reduced motion.
export function useAnimatedNumber(target: number, { duration = 800, delay = 0 }: { duration?: number; delay?: number } = {}) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const wait = started.current ? 0 : delay;
    started.current = true;
    const from = fromRef.current;
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = from + (target - from) * eased;
        fromRef.current = v;
        setValue(v);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, wait);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}
