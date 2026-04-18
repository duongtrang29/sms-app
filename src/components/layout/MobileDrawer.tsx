"use client";

import { GraduationCapIcon, LogOutIcon } from "lucide-react";

import type { SidebarNavGroup } from "@/components/layout/navigation-config";
import { SidebarItem } from "@/components/layout/SidebarItem";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { signOutAction } from "@/features/auth/actions";
import type { AuthenticatedProfile } from "@/types/app";

type MobileDrawerProps = {
  groups: SidebarNavGroup[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  profile: AuthenticatedProfile;
};

export function MobileDrawer({
  groups,
  onOpenChange,
  open,
  profile,
}: MobileDrawerProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="z-40 w-[90vw] max-w-sm p-0" side="left">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCapIcon className="size-4" />
            </span>
            Hệ thống sinh viên
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Điều hướng theo vai trò hiện tại.
          </SheetDescription>
        </SheetHeader>

        <div className="touch-scroll h-[calc(100dvh-var(--topbar-h)-84px)] overflow-y-auto px-2 py-3">
          {groups.map((group) => (
            <section className="mb-4 space-y-2" key={group.label}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
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

        <div className="border-t border-border bg-background px-4 py-3">
          <div className="mb-2 text-xs text-muted-foreground">{profile.email}</div>
          <form action={signOutAction}>
            <Button className="w-full" type="submit" variant="outline">
              <LogOutIcon className="size-4" data-icon="inline-start" />
              Đăng xuất
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
