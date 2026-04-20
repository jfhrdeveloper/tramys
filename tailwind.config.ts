import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C41A3A",
          light:   "#e8304d",
          dark:    "#a01530",
        },
        sede: {
          sa: "#C41A3A",
          pp: "#1d6fa4",
        },
      },
      fontFamily: {
        sans: ["Bricolage Grotesque", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
