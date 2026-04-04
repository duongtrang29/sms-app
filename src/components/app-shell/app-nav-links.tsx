"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navIconMap, navSectionLabelMap } from "@/components/app-shell/nav-icons";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/app";

type AppNavLinksProps = {
  items: NavItem[];
  className?: string;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function AppNavLinks({ items, className }: AppNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-2.5", className)}>
      {items.map((item, index) => {
        const active = isActivePath(pathname, item.href);
        const Icon = navIconMap[item.icon];
        const previousSection = index > 0 ? items[index - 1]?.section : null;
        const showSectionLabel = index === 0 || previousSection !== item.section;

        return (
          <div key={item.href} className="space-y-1">
            {showSectionLabel ? (
              <div className="px-2 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                {navSectionLabelMap[item.section]}
              </div>
            ) : null}
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 text-[0.92rem] font-medium text-muted-foreground transition-all hover:border-border/60 hover:bg-white/80 hover:text-foreground",
                active &&
                  "border-primary/16 bg-primary text-primary-foreground shadow-[0_14px_24px_-22px_rgba(67,92,230,0.72)] hover:bg-primary hover:text-primary-foreground",
              )}
              href={item.href}
            >
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/78 text-muted-foreground transition-colors",
                  active &&
                    "border-white/12 bg-white/14 text-primary-foreground",
                )}
              >
                <Icon className="size-[0.9rem]" />
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-current/0 transition-all",
                  active && "bg-current/85",
                )}
              />
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
