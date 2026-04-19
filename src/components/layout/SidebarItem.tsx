"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SidebarNavItem } from "@/components/layout/navigation-config";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  collapsed: boolean;
  item: SidebarNavItem;
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarItem({ collapsed, item, onNavigate }: SidebarItemProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [expandedByUser, setExpandedByUser] = useState(false);
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  const hasChildren = Boolean(item.children && item.children.length > 0);
  const firstChildHref = item.children?.[0]?.href;
  const targetHref = item.href ?? firstChildHref ?? "#";

  const childIsActive = useMemo(() => {
    return item.children?.some((child) => isActivePath(pathname, child.href)) ?? false;
  }, [item.children, pathname]);

  const active = (item.href ? isActivePath(pathname, item.href) : false) || childIsActive;
  const expanded = childIsActive || expandedByUser;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarsePointer(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const { refs, floatingStyles, context } = useFloating({
    open: floatingOpen,
    onOpenChange: setFloatingOpen,
    placement: "right-start",
    middleware: [offset(10), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: collapsed && hasChildren && !isCoarsePointer,
    move: false,
    delay: {
      open: 70,
      close: 120,
    },
  });
  const click = useClick(context, {
    enabled: collapsed && hasChildren,
    event: "mousedown",
  });
  const focus = useFocus(context, {
    enabled: collapsed && hasChildren,
  });
  const dismiss = useDismiss(context, {
    enabled: collapsed && hasChildren,
  });
  const role = useRole(context, { role: "menu" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    click,
    focus,
    dismiss,
    role,
  ]);
  const setReference = useCallback(
    (node: HTMLElement | null) => {
      refs.setReference(node);
    },
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => {
      refs.setFloating(node);
    },
    [refs],
  );

  const ItemIcon = item.icon;

  if (!hasChildren || !collapsed) {
    return (
      <div className="space-y-1">
        {hasChildren ? (
          <button
            aria-expanded={expanded}
            className={cn(
              "flex min-h-[44px] w-full items-center rounded-lg border px-3 py-2 text-sm transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              active
                ? "border-primary/25 bg-accent text-accent-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
              collapsed ? "justify-center" : "gap-2",
            )}
            onClick={() => setExpandedByUser((prev) => !prev)}
            type="button"
          >
            <ItemIcon className="size-4 shrink-0" />
            <span className={cn("min-w-0 flex-1 truncate", collapsed && "hidden")}>
              {item.label}
            </span>
            <ChevronRightIcon
              className={cn(
                "size-4 shrink-0 transition-transform",
                expanded && "rotate-90",
                collapsed && "hidden",
              )}
            />
          </button>
        ) : (
          <Link
            className={cn(
              "flex min-h-[44px] items-center rounded-lg border px-3 py-2 text-sm transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              active
                ? "border-primary/25 bg-accent text-accent-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
              collapsed ? "justify-center" : "gap-2",
            )}
            href={targetHref}
            onClick={() => onNavigate?.()}
            onFocus={() => {
              router.prefetch(targetHref);
            }}
            onMouseEnter={() => {
              router.prefetch(targetHref);
            }}
            title={collapsed ? item.label : undefined}
          >
            <ItemIcon className="size-4 shrink-0" />
            <span className={cn("min-w-0 flex-1 truncate", collapsed && "hidden")}>
              {item.label}
            </span>
          </Link>
        )}

        {hasChildren ? (
          <div
            className={cn(
              "overflow-hidden transition-all duration-200 ease-out",
              expanded ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <div className="mt-1 space-y-1 pl-4">
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                const childActive = isActivePath(pathname, child.href);

                return (
                  <Link
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                      childActive
                        ? "border-primary/25 bg-accent text-accent-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                    )}
                    href={child.href}
                    key={`${child.href}-${child.label}`}
                    onClick={() => onNavigate?.()}
                    onFocus={() => {
                      router.prefetch(child.href);
                    }}
                    onMouseEnter={() => {
                      router.prefetch(child.href);
                    }}
                  >
                    <ChildIcon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        {...getReferenceProps()}
        aria-expanded={floatingOpen}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
          active
            ? "border-primary/25 bg-accent text-accent-foreground"
            : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
        )}
        onClick={() => setFloatingOpen((open) => !open)}
        ref={setReference}
        title={item.label}
        type="button"
      >
        <ItemIcon className="size-4 shrink-0" />
      </button>

      {floatingOpen ? (
        <FloatingPortal>
          <div
            {...getFloatingProps()}
            className="z-50 min-w-[248px] rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-dropdown)]"
            ref={setFloating}
            style={floatingStyles}
          >
            <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <div className="space-y-1">
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                const childActive = isActivePath(pathname, child.href);

                return (
                  <Link
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                      childActive
                        ? "border-primary/25 bg-accent text-accent-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                    )}
                    href={child.href}
                    key={`${child.href}-${child.label}`}
                    onClick={() => {
                      setFloatingOpen(false);
                      onNavigate?.();
                    }}
                    onFocus={() => {
                      router.prefetch(child.href);
                    }}
                    onMouseEnter={() => {
                      router.prefetch(child.href);
                    }}
                  >
                    <ChildIcon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
