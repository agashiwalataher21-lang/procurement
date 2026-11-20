"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  colorTheme: "blue" | "emerald" | "purple" | "amber" | "rose" | "cyan";
  setColorTheme: (theme: "blue" | "emerald" | "purple" | "amber" | "rose" | "cyan") => void;
  fontSize: "sm" | "base" | "lg";
  setFontSize: (size: "sm" | "base" | "lg") => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [colorTheme, setColorTheme] = useState<"blue" | "emerald" | "purple" | "amber" | "rose" | "cyan">("blue");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check system preference or stored preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedColorTheme = localStorage.getItem("colorTheme") as "blue" | "emerald" | "purple" | "amber" | "rose" | "cyan" | null;
    const savedFontSize = localStorage.getItem("fontSize") as "sm" | "base" | "lg" | null;

    if (savedTheme) setTheme(savedTheme);
    if (savedColorTheme) setColorTheme(savedColorTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    else setFontSize("base");

    // Apply theme class to html element
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleColorTheme = (theme: "blue" | "emerald" | "purple" | "amber" | "rose" | "cyan") => {
    setColorTheme(theme);
    localStorage.setItem("colorTheme", theme);
  };

  const handleFontSize = (size: "sm" | "base" | "lg") => {
    setFontSize(size);
    localStorage.setItem("fontSize", size);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colorTheme, setColorTheme: handleColorTheme, fontSize, setFontSize: handleFontSize, setSidebarCollapsed }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
