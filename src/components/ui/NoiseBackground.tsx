"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import { useEffect, useRef } from "react";

const BORDER_WIDTH = 2;

function GradientLayer({
  springX,
  springY,
  gradientColor,
  opacity,
  multiplier,
}: {
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  gradientColor: string;
  opacity: number;
  multiplier: number;
}) {
  const x = useTransform(springX, (val) => val * multiplier);
  const y = useTransform(springY, (val) => val * multiplier);
  const background = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, ${gradientColor} 0%, transparent 75%)`;

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, background }}
    />
  );
}

interface NoiseBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  gradientColors?: string[];
  speed?: number;
  animating?: boolean;
}

export const NoiseBackground = ({
  children,
  className,
  containerClassName,
  gradientColors = [
    "rgb(45, 106, 79)",
    "rgb(212, 175, 55)",
    "rgb(0, 208, 132)",
  ],
  speed = 0.025,
  animating = true,
}: NoiseBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 80, damping: 25 });
  const springY = useSpring(y, { stiffness: 80, damping: 25 });

  const velocityRef = useRef({ x: 0, y: 0 });
  const lastDirectionChangeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(rect.width / 2);
    y.set(rect.height / 2);
  }, [x, y]);

  const generateVelocityRef = useRef(() => {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = speed * (0.5 + Math.random() * 0.5);
    return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
  });

  useEffect(() => {
    generateVelocityRef.current = () => {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
    };
    velocityRef.current = generateVelocityRef.current();
  }, [speed]);

  useAnimationFrame((time) => {
    if (!animating || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxX = rect.width;
    const maxY = rect.height;

    if (time - lastDirectionChangeRef.current > 1500 + Math.random() * 1500) {
      velocityRef.current = generateVelocityRef.current();
      lastDirectionChangeRef.current = time;
    }

    const padding = 20;
    let newX = x.get() + velocityRef.current.x * 16;
    let newY = y.get() + velocityRef.current.y * 16;

    if (newX < padding || newX > maxX - padding || newY < padding || newY > maxY - padding) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      velocityRef.current = { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
      lastDirectionChangeRef.current = time;
      newX = Math.max(padding, Math.min(maxX - padding, newX));
      newY = Math.max(padding, Math.min(maxY - padding, newY));
    }

    x.set(newX);
    y.set(newY);
  });

  return (
    // Outer shell — animated gradient fills this, visible only as the border gap
    <div
      ref={containerRef}
      className={cn("relative rounded-[10px] overflow-hidden", containerClassName)}
      style={{ padding: `${BORDER_WIDTH}px`, background: "#1a1a1a" }}
    >
      {/* Animated gradient layers — form the glowing border */}
      <GradientLayer springX={springX} springY={springY} gradientColor={gradientColors[0]} opacity={0.9} multiplier={1} />
      <GradientLayer springX={springX} springY={springY} gradientColor={gradientColors[1]} opacity={0.7} multiplier={0.7} />
      <GradientLayer springX={springX} springY={springY} gradientColor={gradientColors[2] ?? gradientColors[0]} opacity={0.6} multiplier={1.3} />

      {/* Inner card — solid bg, sits on top revealing only the 2px gradient border */}
      <div
        className={cn("relative z-10 rounded-[8px]", className)}
        style={{ background: "#111111" }}
      >
        {children}
      </div>
    </div>
  );
};
