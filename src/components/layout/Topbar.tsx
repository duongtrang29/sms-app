"use client";

import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { flattenNavLinks, type SidebarNavGroup } from "@/components/layout/navigation-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOutAction } from "@/features/auth/actions";
import { roleLabel } from "@/lib/auth/roles";
import type { AuthenticatedProfile } from "@/types/app";

type TopbarProps = {
  collapsed: boolean;
  groups: SidebarNavGroup[];
  onOpenMobile: () => void;
  onToggleSidebar: () => void;
  profile: AuthenticatedProfile;
  showSidebarToggle: boolean;
};

type BreadcrumbItem = {
  href?: string;
  label: string;
};

function toTitleCase(segment: string) {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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

function buildBreadcrumb(pathname: string, groups: SidebarNavGroup[]) {
  const labels = new Map(flattenNavLinks(groups).map((item) => [item.href, item.label]));
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: BreadcrumbItem[] = [];
  let builtPath = "";

  segments.forEach((segment, index) => {
    builtPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    crumbs.push(
      isLast
        ? { label: labels.get(builtPath) ?? toTitleCase(segment) }
        : { href: builtPath, label: labels.get(builtPath) ?? toTitleCase(segment) },
    );
  });

  return crumbs;
}

export function Topbar({
  collapsed,
  groups,
  onOpenMobile,
  onToggleSidebar,
  profile,
  showSidebarToggle,
}: TopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = useMemo(() => buildBreadcrumb(pathname, groups), [groups, pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-3 backdrop-blur md:px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          aria-label="Mở menu"
          className="min-h-[44px] lg:hidden"
          onClick={onOpenMobile}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <MenuIcon className="size-4" />
        </Button>

        {showSidebarToggle ? (
          <Button
            aria-label="Thu gọn sidebar"
            className="hidden min-h-[44px] lg:inline-flex"
            onClick={onToggleSidebar}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            {collapsed ? (
              <ChevronRightIcon className="size-4" />
            ) : (
              <ChevronLeftIcon className="size-4" />
            )}
          </Button>
        ) : null}

        <nav aria-label="breadcrumb" className="hidden min-w-0 items-center gap-2 sm:flex">
          {breadcrumbs.map((crumb, index) => (
            <div className="flex min-w-0 items-center gap-2" key={`${crumb.label}-${index}`}>
              {index > 0 ? <span className="text-xs text-gray-400">/</span> : null}
              {crumb.href ? (
                <Link className="truncate text-xs text-muted-foreground hover:text-foreground" href={crumb.href}>
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate text-xs font-semibold text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden lg:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Tìm kiếm" className="h-9 w-60 pl-9" placeholder="Tìm kiếm" />
        </div>

        <Button aria-label="Thông báo" className="min-h-[44px]" size="icon-sm" type="button" variant="outline">
          <BellIcon className="size-4" />
        </Button>

        <div className="hidden text-right md:block">
          <p className="text-xs font-semibold text-foreground">{profile.full_name}</p>
          <p className="text-xs text-muted-foreground">{roleLabel(profile.role_code)}</p>
        </div>

        <Avatar className="size-8">
          <AvatarFallback className="bg-info-soft text-xs font-semibold text-info-foreground">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>

        <form action={signOutAction}>
          <Button className="min-h-[44px]" size="sm" type="submit" variant="outline">
            <LogOutIcon className="size-4" data-icon="inline-start" />
            <span className="hidden lg:inline">Đăng xuất</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
