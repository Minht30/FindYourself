import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["class", "[data-theme='netcafe-night']"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          elevated: "var(--bg-elevated)",
          overlay: "var(--bg-overlay)",
          window: "var(--bg-window)",
          alt: "var(--bg-alt)",
        },
        ink: {
          primary: "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          strong: "var(--accent-strong)",
        },
        cat: {
          deep: "var(--cat-deep)",
          meeting: "var(--cat-meeting)",
          learn: "var(--cat-learn)",
          rest: "var(--cat-rest)",
          personal: "var(--cat-personal)",
          ink: "var(--cat-ink)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        ui: ["var(--font-ui)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        glow: "var(--glow)",
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};

export default config;
