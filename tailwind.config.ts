import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        zoho: {
          blue: "#1565C0",
          blueDark: "#0D47A1",
          blueLight: "#E3F2FD",
          sidebar: "#1A2238",
          sidebarHover: "#242F4B",
          sidebarActive: "#2A385C",
          yellow: "#F59E0B",
          yellowLight: "#FEF3C7",
          border: "#E2E8F0",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          text: "#1E293B",
          textMuted: "#64748B",
          success: "#10B981",
          successLight: "#D1FAE5",
          danger: "#EF4444",
          dangerLight: "#FEE2E2",
          warning: "#F59E0B",
          warningLight: "#FEF3C7",
          info: "#0284C7",
          infoLight: "#E0F2FE",
        },
      },
      boxShadow: {
        zoho: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "zoho-md": "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        "zoho-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
