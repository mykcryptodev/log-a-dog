/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F5C518",
        "primary-dark": "#FFD428",
        secondary: "#E23B2E",
        "secondary-dark": "#FF4D3D",
        accent: "#5BA84A",
        "accent-dark": "#6FCB5A",
        neutral: "#1E1A17",
        "base-100": "#FFF8EC",
        "base-200": "#F4E7CE",
        "base-300": "#E8D5AE",
        "base-dark": "#16110D",
        "base-dark-200": "#221913",
        error: "#D7263D",
        "error-dark": "#FF5C6E",
        info: "#7FB7D9",
        "char": "#1E1A17",
        "bun": "#FFF8EC",
        "mustard": "#F5C518",
        "ketchup": "#E23B2E",
        "relish": "#5BA84A",
        "sus": "#D7263D",
      },
      fontFamily: {
        // Match the web app: Segment is the single brand face (globals.css
        // loads Segment-Medium/Bold and tailwind.config.ts maps sans/display
        // /body to it).
        display: ["Segment-Bold", "System", "sans-serif"],
        body: ["Segment-Medium", "System", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
