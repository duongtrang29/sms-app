"use client";

import { GraduationCapIcon, LogOutIcon } from "lucide-react";

import { SidebarItem } from "@/components/layout/SidebarItem";
import type { SidebarNavGroup } from "@/components/layout/navigation-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { roleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import type { AuthenticatedProfile } from "@/types/app";

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

type SidebarProps = {
  collapsed: boolean;
  groups: SidebarNavGroup[];
  profile: AuthenticatedProfile;
  sidebarWidth: number;
};

export function Sidebar({
  collapsed,
  groups,
  profile,
  sidebarWidth,
}: SidebarProps) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 hidden border-r border-gray-200 bg-white md:flex md:flex-col"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="flex h-[var(--topbar-h)] items-center border-b border-gray-200 px-3">
        <div className={cn("flex min-w-0 items-center gap-2", collapsed && "justify-center")}> 
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-blue-600 text-white">
            <GraduationCapIcon className="size-4" />
          </span>
          <div className={cn("overflow-hidden", collapsed ? "w-0" : "w-auto flex-1")}> 
            <p className="truncate text-sm font-medium text-gray-900">Hệ thống sinh viên</p>
            <p className="truncate text-xs text-gray-500">{roleLabel(profile.role_code)}</p>
          </div>
        </div>
      </div>

      <nav className="app-scrollbar flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <section className="space-y-2" key={group.label}>
            {!collapsed ? (
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-gray-400">{group.label}</p>
            ) : null}
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem collapsed={collapsed} item={item} key={`${group.label}-${item.label}`} />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="space-y-3 border-t border-gray-200 p-2">
        <div className={cn("flex items-center rounded-lg border border-gray-200 bg-gray-50 p-2", collapsed ? "justify-center" : "gap-2")}>
          <Avatar className="size-8">
            <AvatarFallback className="bg-blue-100 text-xs font-medium text-blue-700">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className={cn("min-w-0 overflow-hidden", collapsed ? "w-0" : "w-auto flex-1")}> 
            <p className="truncate text-sm font-medium text-gray-900">{profile.full_name}</p>
            <p className="truncate text-xs text-gray-500">{profile.email}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <Button className="w-full" size={collapsed ? "icon-sm" : "sm"} variant="outline">
            <LogOutIcon className="size-4" />
            <span className={cn("overflow-hidden", collapsed ? "w-0" : "w-auto")}>Đăng xuất</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}
