"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  bgColor?: string;
  height?: number;
  className?: string;
}

export default function ProgressBar({
  value,
  color = "#E8B84B",
  bgColor = "rgba(232,184,75,0.10)",
  height = 6,
  className = "",
}: ProgressBarProps) {
  return (
    <div
      className={`w-full rounded-pill overflow-hidden ${className}`}
      style={{ height, backgroundColor: bgColor }}
    >
      <motion.div
        className="h-full rounded-pill"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}
