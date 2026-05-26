/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f4f8fc",
        signal: "#2563eb",
        navy: "#1d4ed8",
        cloud: "#dbe4f0",
      },
      boxShadow: {
        panel: "0 24px 70px rgba(37, 99, 235, 0.10)",
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "mesh-soft":
          "radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 28%), radial-gradient(circle at top right, rgba(96,165,250,0.12), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #f4f8fc 100%)",
      },
    },
  },
  plugins: [],
};
