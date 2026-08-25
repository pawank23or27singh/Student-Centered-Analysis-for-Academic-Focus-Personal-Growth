export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#124E66",
        accent: "#F58B54",
        sand: "#F3EBDD",
        ink: "#0C1821",
        surface: "#FFFDF8",
      },
      boxShadow: {
        panel: "0 24px 60px rgba(12, 24, 33, 0.10)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
