import { create } from "zustand";

export type SidebarMode = "expanded" | "collapsed";

type SidebarState = {
  mobileOpen: boolean;
  mode: SidebarMode;
  setMobileOpen: (open: boolean) => void;
  setMode: (mode: SidebarMode) => void;
  toggleMode: () => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  mode: "expanded",
  mobileOpen: false,
  setMode: (mode) => set({ mode }),
  toggleMode: () =>
    set((state) => ({
      mode: state.mode === "expanded" ? "collapsed" : "expanded",
    })),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
}));
