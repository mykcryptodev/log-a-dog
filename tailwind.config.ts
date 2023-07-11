import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  themes: [
    {
      light: {
        ...require("daisyui/src/theming/themes")["[data-theme=light]"],
        "primary": "#eab308",
        "secondary": "#a16207",
        "accent": "#fde047",
      },
    },
  ],
  plugins: [require("daisyui")],
} satisfies Config;
