"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Check } from "lucide-react";

interface SwipeConfirmProps {
  onConfirm: () => void;
  disabled?: boolean;
}

export default function SwipeConfirm({ onConfirm, disabled = false }: SwipeConfirmProps) {
  const [confirmed, setConfirmed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const THUMB_SIZE = 52;
  const PADDING = 4;

  const background = useTransform(
    x,
    [0, 200],
    ["rgba(255,255,255,0.05)", "#00D084"]
  );
  const thumbBg = useTransform(
    x,
    [0, 200],
    ["#D4AF37", "#00D084"]
  );
  const textOpacity = useTransform(x, [0, 80], [1, 0]);

  function handleDragEnd() {
    if (!trackRef.current) return;
    const trackWidth = trackRef.current.offsetWidth;
    const maxX = trackWidth - THUMB_SIZE - PADDING * 2;
    const threshold = maxX * 0.8;

    if (x.get() >= threshold) {
      animate(x, maxX, { duration: 0.15 });
      setConfirmed(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      setTimeout(onConfirm, 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }

  return (
    <div className="relative w-full">
      <motion.div
        ref={trackRef}
        style={{ background }}
        className="relative h-[60px] rounded-pill border border-white/10 overflow-hidden select-none"
      >
        <motion.span
          style={{ opacity: textOpacity }}
          className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm font-dm pointer-events-none"
        >
          Geser untuk confirm — sudah bayar →
        </motion.span>

        <motion.div
          drag={disabled || confirmed ? false : "x"}
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x, backgroundColor: confirmed ? "#00D084" : undefined }}
          onDragEnd={handleDragEnd}
          className="absolute left-[4px] top-[4px] h-[52px] w-[52px] rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10"
        >
          <motion.div style={{ backgroundColor: thumbBg }} className="w-full h-full rounded-full flex items-center justify-center">
            {confirmed ? (
              <Check size={22} className="text-bg-primary" strokeWidth={3} />
            ) : (
              <span className="text-bg-primary font-bold text-lg">›</span>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
