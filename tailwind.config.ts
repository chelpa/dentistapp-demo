import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172739", muted: "#5f6f80", canvas: "#f4f7f8", line: "#e4ebee",
        teal: "#0a7a71", tealDark: "#075c56", pale: "#e7f7f4", amber: "#f4a847"
      },
      boxShadow: { card: "0 8px 30px rgba(31, 59, 73, .045)" }
    }
  },
  plugins: []
};
export default config;
