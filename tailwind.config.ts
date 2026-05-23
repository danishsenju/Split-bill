import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0A1628",
        "bg-surface": "#1C2E20",
        "bg-card": "#162318",
        primary: "#1B4332",
        accent: "#D4AF37",
        success: "#00D084",
        danger: "#FF4757",
        warning: "#FFD32A",
        "text-primary": "#F5F0E8",
        "text-secondary": "#8B9E88",
        "text-muted": "#4A5E4C",
        border: "rgba(255,255,255,0.08)",
        glass: "rgba(255,255,255,0.05)",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        dm: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        card: "20px",
        btn: "14px",
        pill: "99px",
        input: "12px",
        sheet: "24px",
      },
      maxWidth: {
        mobile: "480px",
      },
      spacing: {
        micro: "4px",
        tight: "8px",
        default: "16px",
        section: "24px",
        large: "32px",
      },
    },
  },
  plugins: [],
};
export default config;
