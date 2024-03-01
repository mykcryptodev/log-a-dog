import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
  },
  plugins: [require("daisyui")],
} satisfies Config;
