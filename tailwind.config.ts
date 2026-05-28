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
        "bg-primary": "#07090F",
        "bg-surface": "#0E1320",
        "bg-card": "#121928",
        primary: "#1A2F55",
        accent: "#E8B84B",
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        "text-primary": "#F1F0EB",
        "text-secondary": "#8B98B0",
        "text-muted": "#3D4D6A",
        border: "rgba(232,184,75,0.12)",
        glass: "rgba(232,184,75,0.06)",
        // monopo design tokens — wired to theme vars so they swap with mode
        "midnight": "var(--theme-bg)",
        "frost":    "var(--theme-text)",
        "whisper":  "var(--theme-text-muted)",
        "deep-shadow": "var(--theme-bg-card)",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        syne: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        clash: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        dm: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        card: "20px",
        btn: "14px",
        pill: "99px",
        input: "12px",
        sheet: "24px",
        "monopo":   "10px",
        "pill-btn": "75.024px",
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
