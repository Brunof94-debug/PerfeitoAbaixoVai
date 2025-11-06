// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{ts,tsx,js,jsx,html}"
  ],
  theme: { extend: {} },
  plugins: []
} satisfies Config;
