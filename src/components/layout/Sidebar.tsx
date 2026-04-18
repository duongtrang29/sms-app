"use client";

import { GraduationCapIcon, LogOutIcon } from "lucide-react";

import type { SidebarNavGroup } from "@/components/layout/navigation-config";
import { SidebarItem } from "@/components/layout/SidebarItem";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { roleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import type { AuthenticatedProfile } from "@/types/app";

type SidebarProps = {
  collapsed: boolean;
  groups: SidebarNavGroup[];
  profile: AuthenticatedProfile;
};

function getInitials(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "SV";
  }

  return parts.map((part) => part[0]).join("").toUpperCase();
}

export function Sidebar({ collapsed, groups, profile }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 hidden border-r border-border bg-card lg:flex lg:flex-col",
        "transition-[width] duration-300",
      )}
      style={{ width: "var(--sidebar-current-width)" }}
    >
      <div className="flex h-[var(--topbar-h)] items-center gap-2 border-b border-border px-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCapIcon className="size-4" />
        </span>
        <div className={cn("min-w-0", collapsed && "hidden")}>
          <p className="truncate text-sm font-semibold text-foreground">Hệ thống sinh viên</p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel(profile.role_code)}</p>
        </div>
      </div>

      <nav className="touch-scroll flex-1 space-y-5 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <section className="space-y-2" key={group.label}>
            <p
              className={cn(
                "px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                collapsed && "sr-only",
              )}
            >
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  collapsed={collapsed}
                  item={item}
                  key={`${group.label}-${item.label}`}
                />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-2">
        <div
          className={cn(
            "flex min-h-[52px] items-center rounded-lg border border-border bg-muted/45 px-2",
            collapsed ? "justify-center" : "gap-2",
          )}
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-info-soft text-xs font-medium text-info-foreground">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <p className="truncate text-sm font-medium text-foreground">{profile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <Button
            className={cn("w-full", collapsed && "px-0")}
            size={collapsed ? "icon-sm" : "sm"}
            type="submit"
            variant="outline"
          >
            <LogOutIcon className="size-4" />
            <span className={cn(collapsed && "hidden")}>Đăng xuất</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}
