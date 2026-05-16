import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/providers/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in-0": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out-0": { from: { opacity: "1" }, to: { opacity: "0" } },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
      animation: {
        in: "fade-in-0 0.2s ease",
        out: "fade-out-0 0.2s ease",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
