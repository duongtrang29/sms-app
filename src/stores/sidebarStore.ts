import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setCollapsed: (next: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      setCollapsed: (isCollapsed) => set({ isCollapsed }),
      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      setMobileOpen: (isMobileOpen) => set({ isMobileOpen }),
    }),
    {
      name: "sms-sidebar",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    },
  ),
);
