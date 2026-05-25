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
  const [pressing, setPressing] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const THUMB_SIZE = 52;
  const PADDING = 4;

  const background = useTransform(
    x,
    [0, 200],
    ["rgba(232,184,75,0.06)", "#22C55E"]
  );
  const thumbBg = useTransform(
    x,
    [0, 200],
    ["#E8B84B", "#22C55E"]
  );
  const textOpacity = useTransform(x, [0, 80], [1, 0]);
  const thumbScale = pressing ? 1.08 : 1;

  function handleDragEnd(_: unknown, info: { velocity: { x: number } }) {
    if (!trackRef.current) return;
    const trackWidth = trackRef.current.offsetWidth;
    const maxX = trackWidth - THUMB_SIZE - PADDING * 2;
    const threshold = maxX * 0.6;
    const fastEnough = info.velocity.x > 0.11;

    if (x.get() >= threshold || fastEnough) {
      animate(x, maxX, { duration: 0.15 });
      setConfirmed(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      setTimeout(onConfirm, 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
    }
    setPressing(false);
  }

  return (
    <div className="relative w-full">
      <motion.div
        ref={trackRef}
        style={{ background }}
        className="relative h-[60px] rounded-pill border border-accent/20 overflow-hidden select-none"
      >
        <motion.span
          style={{ opacity: textOpacity }}
          className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm font-dm pointer-events-none pl-16"
        >
          Geser untuk confirm — sudah bayar →
        </motion.span>

        <motion.div
          drag={disabled || confirmed ? false : "x"}
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x, backgroundColor: confirmed ? "#22C55E" : undefined }}
          onDragStart={() => setPressing(true)}
          onDragEnd={handleDragEnd}
          animate={{ scale: thumbScale }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="absolute left-[4px] top-[4px] h-[52px] w-[52px] rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10"
        >
          <motion.div
            style={{ backgroundColor: thumbBg }}
            className="w-full h-full rounded-full flex items-center justify-center"
          >
            {confirmed ? (
              <Check size={22} className="text-bg-primary" strokeWidth={3} />
            ) : (
              <span className="text-bg-primary font-bold text-lg leading-none">›</span>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
