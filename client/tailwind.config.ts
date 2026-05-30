import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        card: "var(--card)",
        "card-raised": "var(--card-raised)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-4": "var(--ink-4)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        "line-strong": "var(--line-strong)",
        accent: "var(--accent)",
        "accent-press": "var(--accent-press)",
        "accent-wash": "var(--accent-wash)",
        "accent-ink": "var(--accent-ink)",
        good: "var(--good)",
        "good-wash": "var(--good-wash)",
        warn: "var(--warn)",
        "warn-wash": "var(--warn-wash)",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "Hanken Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SF Mono", "monospace"],
      },
      borderRadius: {
        sm: "var(--r-sm)",
        DEFAULT: "var(--r)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
    },
  },
  plugins: [],
};

export default config;
