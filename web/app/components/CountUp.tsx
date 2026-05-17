"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 700,
}: {
  value: number | null;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState<string>("—");
  const prev = useRef(0);

  useEffect(() => {
    if (value == null) {
      setDisplay("—");
      return;
    }
    const start = prev.current;
    const target = value;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const v = start + (target - start) * ease;
      setDisplay(v.toFixed(decimals) + suffix);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setDisplay(target.toFixed(decimals) + suffix);
        prev.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, decimals, suffix, duration]);

  return <>{display}</>;
}
