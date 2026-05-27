import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f7f8fb",
        surface: "#ffffff",
        primary: "#2563eb",
        "primary-dark": "#1e40af",
        accent: "#0f766e",
        danger: "#dc2626",
        success: "#16a34a",
        "text-base": "#111827",
        muted: "#64748b",
        "border-base": "#d9e2ec"
      },
      borderRadius: {
        app: "8px"
      },
      spacing: {
        shell: "min(1120px, calc(100vw - 32px))"
      }
    }
  },
  plugins: []
};

export default config;
