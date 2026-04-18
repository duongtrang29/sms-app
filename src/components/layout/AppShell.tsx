"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const {
    isCollapsed,
    isMobileOpen,
    setMobileOpen,
    toggleCollapsed,
  } = useSidebar();

  const collapsed = isDesktop ? isCollapsed : true;
  const sidebarWidth = collapsed ? "var(--sidebar-collapsed-w)" : "var(--sidebar-w)";
  const groups = roleNavGroups[profile.role_code];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop, setMobileOpen]);

  return (
    <div
      className="relative min-h-screen bg-background lg:h-dvh lg:overflow-hidden"
      style={{
        "--sidebar-current-width": sidebarWidth,
      } as React.CSSProperties}
    >
      <Sidebar collapsed={collapsed} groups={groups} profile={profile} />

      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col transition-[margin-left] duration-300 lg:h-dvh lg:min-h-0"
        style={{ marginLeft: isDesktop ? "var(--sidebar-current-width)" : 0 }}
      >
        <Topbar
          collapsed={collapsed}
          groups={groups}
          onOpenMobile={() => setMobileOpen(true)}
          onToggleSidebar={toggleCollapsed}
          profile={profile}
          showSidebarToggle={isDesktop}
        />

        <main className="touch-scroll flex-1 min-h-0 min-w-0 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-[var(--content-max-w)] min-w-0 flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      <MobileDrawer
        groups={groups}
        onOpenChange={setMobileOpen}
        open={isMobileOpen}
        profile={profile}
      />
    </div>
  );
}
