import { AppNavLinks } from "@/components/app-shell/app-nav-links";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCapIcon, LogOutIcon } from "lucide-react";
import { navigationItems } from "@/lib/constants/navigation";
import { roleLabel } from "@/lib/auth/roles";
import { signOutAction } from "@/features/auth/actions";
import type { AuthenticatedProfile } from "@/types/app";
type AppShellProps = {
  children: React.ReactNode;
  profile: AuthenticatedProfile;
};

export function AppShell({ children, profile }: AppShellProps) {
  const items = navigationItems.filter((item) =>
    item.roles.includes(profile.role_code),
  );

  return (
    <div className="app-shell-grid h-screen overflow-hidden">
      <div className="mx-auto flex h-screen max-w-[1680px]">
        <aside className="hidden h-screen w-[276px] shrink-0 border-r border-border/70 bg-sidebar/88 backdrop-blur-xl md:flex md:flex-col">
          <div className="border-b border-border/70 px-4 py-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-info-foreground)]">
              <GraduationCapIcon className="size-3.5" />
              Student SaaS
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="text-lg font-semibold tracking-tight text-foreground">
                {profile.full_name}
              </div>
              <p className="max-w-[18rem] text-sm leading-6 text-muted-foreground">
                Bảng điều khiển học vụ gọn, tập trung và ưu tiên thao tác nhanh.
              </p>
            </div>
            <Badge className="mt-3" variant="info">
              {roleLabel(profile.role_code)}
            </Badge>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-2.5 py-3">
            <AppNavLinks className="app-scrollbar min-h-0 flex-1 overflow-y-auto pr-1" items={items} />
          </div>
          <div className="border-t border-border/70 p-4">
            <form action={signOutAction}>
              <Button className="w-full" variant="outline">
                <LogOutIcon data-icon="inline-start" />
                Đăng xuất
              </Button>
            </form>
          </div>
        </aside>
        <div className="app-scrollbar flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/88 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="flex items-center gap-3">
              <MobileNav items={items} />
              <div>
                <div className="text-sm font-semibold tracking-tight text-foreground">
                  Hệ thống quản lý sinh viên
                </div>
                <div className="text-xs text-muted-foreground">
                  {roleLabel(profile.role_code)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <div className="text-sm font-medium">{profile.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {profile.email}
                </div>
              </div>
              <form action={signOutAction}>
                <Button variant="outline">
                  <LogOutIcon data-icon="inline-start" />
                  Đăng xuất
                </Button>
              </form>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
