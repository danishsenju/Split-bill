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
import Link from "next/link";
import { useEffect, useRef, Ref } from "react";

// ─── Animated radial gradient layer ───────────────────────────────────────
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
  const background = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, ${gradientColor} 0%, transparent 50%)`;

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, background }}
    />
  );
}

// ─── PrimaryButton — noise-halo CTA pill ──────────────────────────────────
// Matches the "Start publishing →" reference: dark inner pill, animated
// pink/blue/orange noise glow ring around it. Drop-in replacement for the
// flat Deep Ocean gradient pill buttons used throughout the app.
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  href?: string;
  className?: string;
  innerClassName?: string;
  fullWidth?: boolean;
  /** Custom 3-stop colors for the noise gradient ring */
  gradientColors?: [string, string, string];
  /** Slow the gradient drift (0.05 = subtle, 0.15 = lively) */
  speed?: number;
  /** Opacity of the noise grain texture (0–1) */
  noiseIntensity?: number;
  ariaLabel?: string;
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  href,
  className,
  innerClassName,
  fullWidth = true,
  gradientColors = [
    "rgb(255, 100, 150)",
    "rgb(100, 150, 255)",
    "rgb(255, 200, 100)",
  ],
  speed = 0.1,
  noiseIntensity = 0.2,
  ariaLabel,
}: PrimaryButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  const topGradientX = useTransform(springX, (val) => val * 0.1 - 50);

  const velocityRef = useRef({ x: 0, y: 0 });
  const lastDirectionChangeRef = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(rect.width / 2);
    y.set(rect.height / 2);
  }, [x, y]);

  const generateRef = useRef(() => {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = speed * (0.5 + Math.random() * 0.5);
    return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
  });

  useEffect(() => {
    generateRef.current = () => {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
    };
    velocityRef.current = generateRef.current();
  }, [speed]);

  useAnimationFrame((time) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const maxX = rect.width;
    const maxY = rect.height;

    if (time - lastDirectionChangeRef.current > 1500 + Math.random() * 1500) {
      velocityRef.current = generateRef.current();
      lastDirectionChangeRef.current = time;
    }

    const dt = 16;
    let newX = x.get() + velocityRef.current.x * dt;
    let newY = y.get() + velocityRef.current.y * dt;
    const padding = 20;

    if (
      newX < padding ||
      newX > maxX - padding ||
      newY < padding ||
      newY > maxY - padding
    ) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      velocityRef.current = {
        x: Math.cos(angle) * magnitude,
        y: Math.sin(angle) * magnitude,
      };
      lastDirectionChangeRef.current = time;
      newX = Math.max(padding, Math.min(maxX - padding, newX));
      newY = Math.max(padding, Math.min(maxY - padding, newY));
    }

    x.set(newX);
    y.set(newY);
  });

  // Outer "ring" classes — this is the wrap that becomes the click target
  const wrapClasses = cn(
    "relative overflow-hidden rounded-full p-[3px] backdrop-blur-sm",
    "shadow-[0px_1px_0px_0px_#0a0a0a_inset,0px_1px_0px_0px_#262626]",
    "transition-transform duration-100 active:scale-[0.98]",
    disabled && "opacity-40 cursor-not-allowed pointer-events-none",
    fullWidth && "w-full block",
    className,
  );

  // Inner pill — theme-aware: dark mode = dark pill / light mode = dark pill on cream wrap.
  // We always keep the inner pill dark for legibility against the noise ring's bright halo.
  const innerPill = (
    <span
      className={cn(
        "relative z-10 flex items-center justify-center gap-2 rounded-full",
        "bg-gradient-to-r from-black via-black to-neutral-900",
        "px-6 py-3 text-sm font-semibold text-white",
        "shadow-[0px_1px_0px_0px_#0a0a0a_inset,0px_1px_0px_0px_#262626]",
        innerClassName,
      )}
    >
      {children}
    </span>
  );

  const innerStructure = (
    <>
      {/* Moving gradient layers */}
      <GradientLayer
        springX={springX}
        springY={springY}
        gradientColor={gradientColors[0]}
        opacity={0.4}
        multiplier={1}
      />
      <GradientLayer
        springX={springX}
        springY={springY}
        gradientColor={gradientColors[1]}
        opacity={0.3}
        multiplier={0.7}
      />
      <GradientLayer
        springX={springX}
        springY={springY}
        gradientColor={gradientColors[2] ?? gradientColors[0]}
        opacity={0.25}
        multiplier={1.2}
      />

      {/* Top gradient strip (slow horizontal drift) */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1 rounded-t-full opacity-80 blur-sm pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${gradientColors.join(", ")})`,
          x: disabled ? 0 : topGradientX,
        }}
      />

      {/* Static noise grain */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        style={{ "--noise-opacity": noiseIntensity } as React.CSSProperties}
      >
        <img
          src="https://assets.aceternity.com/noise.webp"
          alt=""
          className="h-full w-full object-cover opacity-[var(--noise-opacity)]"
          style={{ mixBlendMode: "overlay" }}
        />
      </div>

      {innerPill}
    </>
  );

  if (href) {
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        className={wrapClasses}
      >
        {innerStructure}
      </Link>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={wrapClasses}
    >
      {innerStructure}
    </button>
  );
}
