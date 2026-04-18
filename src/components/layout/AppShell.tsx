"use client";

import { useEffect } from "react";

import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { roleNavGroups } from "@/components/layout/navigation-config";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebar } from "@/hooks/useSidebar";
import type { AuthenticatedProfile } from "@/types/app";

type AppShellProps = {
  children: React.ReactNode;
  profile: AuthenticatedProfile;
};

export function AppShell({ children, profile }: AppShellProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 767px)");

  const {
    collapsed,
    mobileOpen,
    setMobileOpen,
    setMode,
    toggleMode,
  } = useSidebar();

  const groups = roleNavGroups[profile.role_code];
  const sidebarWidth = collapsed ? 64 : 240;

  useEffect(() => {
    if (isDesktop) {
      setMode("expanded");
      return;
    }

    if (isTablet) {
      setMode("collapsed");
      return;
    }

    if (isMobile) {
      setMode("collapsed");
      setMobileOpen(false);
    }
  }, [isDesktop, isMobile, isTablet, setMobileOpen, setMode]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen overflow-hidden" style={{ "--sidebar-current-w": `${sidebarWidth}px` } as React.CSSProperties}>
        <Sidebar
          collapsed={collapsed}
          groups={groups}
          profile={profile}
          sidebarWidth={sidebarWidth}
        />

        <div className="flex min-w-0 flex-1 flex-col md:pl-[var(--sidebar-current-w)]">
          <Topbar
            collapsed={collapsed}
            groups={groups}
            onOpenMobile={() => setMobileOpen(true)}
            onToggleSidebar={toggleMode}
            profile={profile}
          />

          <main className="app-scrollbar min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto flex min-w-0 w-full max-w-[var(--content-max-w)] flex-col gap-6">
              {children}
            </div>
          </main>
        </div>

        <MobileDrawer
          groups={groups}
          onOpenChange={setMobileOpen}
          open={mobileOpen}
        />
      </div>
    </div>
  );
}
