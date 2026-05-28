"use client";

import React from "react";
import {
  Home,
  Heart,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Utensils,
  PartyPopper,
  Plane,
} from "lucide-react";

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Lifted state — turns stark white + thicker stroke */
  selected?: boolean;
}

// monopo-aligned: monochromatic outlined icons, distinction by shape only.
// Default tone is Frost White (warm), selected tone steps up to stark white
// with thicker stroke for tactile feedback.
export default function CategoryIcon({
  category,
  size = 24,
  className,
  style,
  selected = false,
}: CategoryIconProps) {
  const key = category.toLowerCase();

  const props = {
    size,
    className,
    strokeWidth: selected ? 2 : 1.5,
    style: {
      color: selected ? "var(--theme-text-strong)" : "var(--theme-text)",
      transition:
        "color 220ms cubic-bezier(0.23,1,0.32,1), stroke-width 220ms cubic-bezier(0.23,1,0.32,1)",
      ...style,
    } as React.CSSProperties,
  };

  if (key.includes("makan")) return <Utensils {...props} />;
  if (key.includes("hiburan")) return <PartyPopper {...props} />;
  if (key.includes("trip")) return <Plane {...props} />;
  if (key.includes("rumah")) return <Home {...props} />;
  if (key.includes("kesihatan")) return <Heart {...props} />;
  if (key.includes("belajar")) return <BookOpen {...props} />;
  if (key.includes("beli")) return <ShoppingBag {...props} />;
  return <Sparkles {...props} />;
}
