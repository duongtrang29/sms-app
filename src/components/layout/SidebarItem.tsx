"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { SidebarNavItem } from "@/components/layout/navigation-config";

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
  const [floatingOpen, setFloatingOpen] = useState(false);

  const hasChildren = Boolean(item.children && item.children.length > 0);
  const firstChildHref = item.children?.[0]?.href;
  const targetHref = item.href ?? firstChildHref ?? "#";

  const childIsActive = useMemo(() => {
    return item.children?.some((child) => isActivePath(pathname, child.href)) ?? false;
  }, [item.children, pathname]);

  const active = (item.href ? isActivePath(pathname, item.href) : false) || childIsActive;

  const { refs, floatingStyles, context } = useFloating({
    open: floatingOpen,
    onOpenChange: setFloatingOpen,
    placement: "right-start",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: collapsed && hasChildren,
    move: false,
    delay: {
      open: 80,
      close: 120,
    },
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
    focus,
    dismiss,
    role,
  ]);
  const setReference = refs.setReference;
  const setFloating = refs.setFloating;

  const ItemIcon = item.icon;

  return (
    <div className="space-y-1">
      <Link
        {...getReferenceProps({
          onClick: () => {
            onNavigate?.();
          },
        })}
        className={cn(
          "group flex h-11 min-h-[44px] items-center rounded-md border px-3 text-sm transition-colors",
          "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none",
          active
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50",
          collapsed ? "justify-center" : "gap-2",
        )}
        href={targetHref}
        onFocus={() => {
          router.prefetch(targetHref);
        }}
        onMouseEnter={() => {
          router.prefetch(targetHref);
        }}
        // eslint-disable-next-line react-hooks/refs
        ref={setReference}
        title={collapsed ? item.label : undefined}
      >
        <ItemIcon className="size-4 shrink-0" />
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap",
            collapsed ? "w-0" : "w-auto flex-1",
          )}
        >
          {item.label}
        </span>
      </Link>

      {!collapsed && hasChildren ? (
        <div className="space-y-1 pl-6">
          {item.children?.map((child) => {
            const ChildIcon = child.icon;
            const childActive = isActivePath(pathname, child.href);

            return (
              <Link
                className={cn(
                  "flex h-10 min-h-[40px] items-center gap-2 rounded-md border px-3 text-sm",
                  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                  childActive
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50",
                )}
                href={child.href}
                key={child.href}
                onClick={() => onNavigate?.()}
              >
                <ChildIcon className="size-4" />
                <span className="min-w-0 flex-1 truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {collapsed && hasChildren && floatingOpen ? (
        <FloatingPortal>
          <div
            {...getFloatingProps()}
            className="z-50 min-w-[220px] rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
            // eslint-disable-next-line react-hooks/refs
            ref={setFloating}
            style={floatingStyles}
          >
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              {item.label}
            </p>
            <div className="space-y-1">
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                const childActive = isActivePath(pathname, child.href);

                return (
                  <Link
                    className={cn(
                      "flex h-10 min-h-[40px] items-center gap-2 rounded-md border px-3 text-sm",
                      "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                      childActive
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50",
                    )}
                    href={child.href}
                    key={child.href}
                    onClick={() => onNavigate?.()}
                  >
                    <ChildIcon className="size-4" />
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
