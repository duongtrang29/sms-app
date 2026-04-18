"use client";

import { useSidebarStore } from "@/stores/sidebarStore";

export function useSidebar() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const setCollapsed = useSidebarStore((state) => state.setCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  return {
    isCollapsed,
    isMobileOpen,
    setCollapsed,
    setMobileOpen,
    toggleCollapsed,
  };
}
