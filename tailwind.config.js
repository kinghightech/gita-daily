/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],

  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/**/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 3.9%)",
        foreground: "hsl(0 0% 98%)",

        card: "hsl(0 0% 3.9%)",
        "card-foreground": "hsl(0 0% 98%)",

        popover: "hsl(0 0% 3.9%)",
        "popover-foreground": "hsl(0 0% 98%)",

        primary: "hsl(0 0% 98%)",
        "primary-foreground": "hsl(0 0% 9%)",

        secondary: "hsl(0 0% 14.9%)",
        "secondary-foreground": "hsl(0 0% 98%)",

        muted: "hsl(0 0% 14.9%)",
        "muted-foreground": "hsl(0 0% 63.9%)",

        accent: "hsl(0 0% 14.9%)",
        "accent-foreground": "hsl(0 0% 98%)",

        destructive: "hsl(0 62.8% 30.6%)",
        "destructive-foreground": "hsl(0 0% 98%)",

        border: "hsl(0 0% 14.9%)",
        input: "hsl(0 0% 14.9%)",
        ring: "hsl(0 0% 83.1%)",
      },

      borderRadius: {
        lg: "8px",
      },
    },
  },

  plugins: [],
};