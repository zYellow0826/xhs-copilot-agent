import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        xhs: {
          pink: "#ff2442",
        },
      },
    },
  },
  plugins: [],
};

export default config;
