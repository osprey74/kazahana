/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0085FF",
        "bg-light": "#FFFFFF",
        "bg-dark": "#1A1A2E",
        "text-light": "#1A1A1A",
        "text-dark": "#E8E8E8",
        "border-light": "#E4E4E4",
        "border-dark": "#2E2E42",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        btn: "6px",
      },
      maxWidth: {
        content: "600px",
      },
      minWidth: {
        content: "400px",
      },
    },
  },
  plugins: [],
};
