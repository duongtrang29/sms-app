"use client";

import { GraduationCapIcon } from "lucide-react";

import { SidebarItem } from "@/components/layout/SidebarItem";
import type { SidebarNavGroup } from "@/components/layout/navigation-config";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type MobileDrawerProps = {
  groups: SidebarNavGroup[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MobileDrawer({
  groups,
  onOpenChange,
  open,
}: MobileDrawerProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-[88vw] max-w-sm p-0" side="left">
        <SheetHeader className="border-b border-gray-200 px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-medium">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-blue-600 text-white">
              <GraduationCapIcon className="size-4" />
            </span>
            Hệ thống sinh viên
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-500">
            Điều hướng nhanh theo vai trò hiện tại.
          </SheetDescription>
        </SheetHeader>
        <div className="app-scrollbar h-[calc(100vh-var(--topbar-h))] overflow-y-auto px-2 py-3">
          {groups.map((group) => (
            <section className="mb-4 space-y-2" key={group.label}>
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-gray-400">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem
                    collapsed={false}
                    item={item}
                    key={`${group.label}-${item.label}`}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
