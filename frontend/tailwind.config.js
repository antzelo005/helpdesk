/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f4f7fb",
        signal: "#0f766e",
        ember: "#f97316",
        cloud: "#dbe4f0",
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "mesh-soft":
          "radial-gradient(circle at top left, rgba(15,118,110,0.14), transparent 28%), radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
      },
    },
  },
  plugins: [],
};
