import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#0B0F0D',
        ink: '#E8E4DB',
        forest: '#3D8B6E',
        gold: '#C9A227',
        brick: '#7A2E2E',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)'],
        sans: ['var(--font-inter)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
export default config;
