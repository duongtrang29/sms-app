"use client";

import { useSidebarStore } from "@/stores/sidebarStore";

export function useSidebar() {
  const mode = useSidebarStore((state) => state.mode);
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const setMode = useSidebarStore((state) => state.setMode);
  const toggleMode = useSidebarStore((state) => state.toggleMode);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  return {
    collapsed: mode === "collapsed",
    mobileOpen,
    mode,
    setMobileOpen,
    setMode,
    toggleMode,
  };
}
