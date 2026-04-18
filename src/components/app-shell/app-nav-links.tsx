"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <nav className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const active = isActivePath(pathname, item.href);
        const Icon = navIconMap[item.icon];
        const previousSection = index > 0 ? items[index - 1]?.section : null;
        const showSectionLabel = index === 0 || previousSection !== item.section;

        return (
          <div key={item.href} className="space-y-2">
            {showSectionLabel ? (
              <div className="text-label px-2 text-muted-foreground/80">
                {navSectionLabelMap[item.section]}
              </div>
            ) : null}
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-medium)] border border-transparent px-3 py-2 text-body font-medium text-muted-foreground transition-colors md:min-h-10",
                "hover:border-border hover:bg-accent/50 hover:text-foreground",
                active &&
                  "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
              href={item.href}
              onFocus={() => router.prefetch(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
            >
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-small)] border border-border bg-background text-muted-foreground transition-colors",
                  active &&
                    "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground",
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
