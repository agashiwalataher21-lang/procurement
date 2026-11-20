"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem("bait_sidebar_collapsed", String(value));
  }, []);

  const toggleSidebar = useCallback(() => {
    const newValue = !collapsed;
    setCollapsedState(newValue);
    localStorage.setItem("bait_sidebar_collapsed", String(newValue));
  }, [collapsed]);

  const value = {
    collapsed,
    toggleSidebar,
    setCollapsed,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
