"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { navIconMap, navSectionLabelMap } from "@/components/app-shell/nav-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavItem } from "@/types/app";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  items: NavItem[];
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sheet>
      <SheetTrigger
        render={<Button className="md:hidden" size="icon-sm" variant="secondary" />}
      >
        <MenuIcon />
        <span className="sr-only">Mở điều hướng</span>
      </SheetTrigger>
      <SheetContent className="w-80 border-border bg-background/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle>Điều hướng</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 space-y-3 overflow-y-auto pb-6">
          {items.map((item, index) => {
            const active = isActivePath(pathname, item.href);
            const Icon = navIconMap[item.icon];
            const previousSection = index > 0 ? items[index - 1]?.section : null;
            const showSectionLabel = index === 0 || previousSection !== item.section;

            return (
              <div key={item.href} className="space-y-2">
                {showSectionLabel ? (
                  <div className="text-label px-1 text-muted-foreground/80">
                    {navSectionLabelMap[item.section]}
                  </div>
                ) : null}
                <Link
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-[var(--radius-medium)] border border-transparent px-3 py-2 text-body font-medium text-muted-foreground",
                    "hover:border-border hover:bg-accent/55 hover:text-foreground",
                    active &&
                      "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                  href={item.href}
                  onFocus={() => router.prefetch(item.href)}
                  onMouseEnter={() => router.prefetch(item.href)}
                >
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-small)] border border-border bg-background text-muted-foreground",
                      active && "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground",
                    )}
                  >
                    <Icon className="size-[0.9rem]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
