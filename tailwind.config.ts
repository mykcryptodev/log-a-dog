/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        'brand-gradient-dark': 'radial-gradient(50% 50% at 50% 50%, #eab308 -100%, rgba(241, 243, 115, 0) 100%)',
        'brand-gradient-light': 'radial-gradient(50% 50% at 50% 50%, #fde047 -100%, rgba(241, 243, 115, 0) 100%)',
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          "primary": "#eab308",
          "secondary": "#a16207",
          "accent": "#fde047",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["[data-theme=dark]"],
          "primary": "#eab308",
          "secondary": "#a16207",
          "accent": "#fde047",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
} satisfies Config;
