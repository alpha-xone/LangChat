/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // Indigo 600
        secondary: "#F59E0B", // Amber 500
        accent: "#10B981", // Emerald 500
        background: "#F3F4F6", // Gray 200
        text: "#111827", // Gray 900
        light: {
          100: "#F9FAFB", // Gray 100
          200: "#E5E7EB", // Gray 200
          300: "#D1D5DB", // Gray 300
        },
        dark: {
          100: "#1F2937", // Gray 800
          200: "#111827", // Gray 900
          300: "#0F172A", // Gray 950
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
    },
  },
  plugins: [],
}
