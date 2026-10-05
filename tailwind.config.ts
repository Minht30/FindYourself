import type { Config } from "tailwindcss";

// Theme colors are plain CSS variables (hex values that flip per theme), so
// Tailwind can't split them into channels for opacity modifiers like
// `border-accent/60`, and before this helper those classes emitted no CSS at
// all. color-mix() applies the alpha at runtime instead; with no modifier,
// <alpha-value> is 1 and the color is unchanged.
const tone = (cssVar: string) => `color-mix(in srgb, var(${cssVar}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["class", "[data-theme='netcafe-night']"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: tone("--bg-base"),
          elevated: tone("--bg-elevated"),
          overlay: tone("--bg-overlay"),
          window: tone("--bg-window"),
          alt: tone("--bg-alt"),
        },
        ink: {
          primary: tone("--ink-primary"),
          secondary: tone("--ink-secondary"),
          muted: tone("--ink-muted"),
        },
        accent: {
          DEFAULT: tone("--accent"),
          soft: tone("--accent-soft"),
          strong: tone("--accent-strong"),
        },
        cat: {
          deep: tone("--cat-deep"),
          meeting: tone("--cat-meeting"),
          learn: tone("--cat-learn"),
          rest: tone("--cat-rest"),
          personal: tone("--cat-personal"),
          ink: tone("--cat-ink"),
        },
        success: tone("--success"),
        warning: tone("--warning"),
        danger: tone("--danger"),
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
