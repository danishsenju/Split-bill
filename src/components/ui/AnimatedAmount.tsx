"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface AnimatedAmountProps {
  /** Final ringgit value to count up to */
  value: number;
  /** Font size of the numeric portion (px) */
  size?: number;
  /** Duration of the count-up in ms */
  duration?: number;
  /** Re-run the count-up whenever this key changes */
  animateKey?: string | number;
  className?: string;
  style?: CSSProperties;
}

// easeOutExpo — fast start, gentle landing. The Emil Kowalski "settle" feel.
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * AnimatedAmount — a ringgit figure that counts up on mount with a drifting
 * Deep Ocean gradient. Tabular figures keep the width stable so nothing jumps.
 */
export default function AnimatedAmount({
  value,
  size = 62,
  duration = 1000,
  animateKey,
  className,
  style,
}: AnimatedAmountProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || value <= 0) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(from + (value - from) * easeOutExpo(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, animateKey]);

  return (
    <span
      className={`gradient-text ${className ?? ""}`}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: `${Math.round(size * 0.12)}px`,
        fontFamily: "var(--font-plus-jakarta), system-ui",
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      <span style={{ fontSize: `${Math.round(size * 0.42)}px`, fontWeight: 700, opacity: 0.85 }}>
        RM
      </span>
      <span style={{ fontSize: `${size}px` }}>{display.toFixed(2)}</span>
    </span>
  );
}
