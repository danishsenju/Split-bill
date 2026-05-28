"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

// Emil-grade theme toggle.
// Spring-animated thumb. Icon cross-fades + rotates on swap. Subtle haptic.
// State carries glow color: warm amber for light, cool frost for dark.
export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const isLight = theme === "light";

  function handle() {
    navigator.vibrate?.(12);
    toggleTheme();
  }

  // Suppress visual state until hydrated, but keep dimensions
  if (!mounted) {
    return (
      <span
        aria-hidden
        style={{
          width: 58,
          height: 30,
          borderRadius: 99,
          background: "transparent",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handle}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      aria-label={isLight ? "Tukar ke mod gelap" : "Tukar ke mod cerah"}
      aria-pressed={isLight}
      style={{
        position: "relative",
        width: 58,
        height: 30,
        borderRadius: 99,
        background: isLight
          ? "rgba(10,10,10,0.08)"
          : "rgba(245,240,232,0.06)",
        border: `1px solid ${
          isLight ? "rgba(10,10,10,0.14)" : "rgba(245,240,232,0.14)"
        }`,
        cursor: "pointer",
        outline: "none",
        flexShrink: 0,
        transition:
          "background 280ms cubic-bezier(0.23,1,0.32,1), border-color 280ms cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* Track stars (light) / dots (dark) — atmospheric hint */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 99,
          background: isLight
            ? "radial-gradient(circle at 78% 50%, rgba(255,172,46,0.18) 0%, transparent 50%)"
            : "radial-gradient(circle at 22% 50%, rgba(245,240,232,0.12) 0%, transparent 55%)",
          transition: "background 350ms cubic-bezier(0.23,1,0.32,1)",
          pointerEvents: "none",
        }}
      />

      {/* Spring-driven thumb */}
      <motion.span
        animate={{ x: isLight ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        style={{
          position: "absolute",
          top: 2,
          left: 2,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: isLight ? "#FFFFFF" : "#F5F0E8",
          boxShadow: isLight
            ? "0 1px 3px rgba(0,0,0,0.20), 0 0 12px rgba(255,172,46,0.30)"
            : "0 1px 4px rgba(0,0,0,0.30), 0 0 10px rgba(245,240,232,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isLight ? "#FFAC2E" : "#0a0a0a",
            }}
          >
            {isLight ? <Sun size={13} strokeWidth={2.2} /> : <Moon size={13} strokeWidth={2.2} />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.button>
  );
}
