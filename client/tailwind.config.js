/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11212d",
        brand: "#d97d54",
        sand: "#f7efe5",
        moss: "#627c69",
        teal: "#244855",
      },
      boxShadow: {
        soft: "0 20px 45px rgba(17, 33, 45, 0.12)",
      },
    },
  },
  plugins: [],
};

