import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        league: ['"League Spartan"', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
} satisfies Config;
