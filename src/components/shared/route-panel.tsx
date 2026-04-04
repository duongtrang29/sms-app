"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RoutePanelProps = {
  badge?: string;
  children: React.ReactNode;
  closeHref: string;
  description?: string;
  icon?: React.ReactNode;
  open: boolean;
  size?: "lg" | "xl";
  title: string;
  variant?: "dialog" | "drawer";
};

const dialogSizeClassNameMap = {
  lg: "max-w-4xl",
  xl: "max-w-6xl",
} as const;

const drawerSizeClassNameMap = {
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

function PanelHeader({
  badge,
  description,
  icon,
  title,
}: Pick<RoutePanelProps, "badge" | "description" | "icon" | "title">) {
  return (
    <div className="flex items-start gap-4">
      {icon ? (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,246,255,0.94))] text-[color:var(--color-info-foreground)] shadow-[0_18px_36px_-28px_rgba(46,77,175,0.4)]">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 space-y-2">
        {badge ? (
          <Badge className="h-6 px-2.5 text-[0.68rem] uppercase tracking-[0.18em]" variant="info">
            {badge}
          </Badge>
        ) : null}
        <div className="space-y-1">
          <div className="text-xl font-semibold tracking-[-0.04em] text-foreground">
            {title}
          </div>
          {description ? (
            <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function RoutePanel({
  badge,
  children,
  closeHref,
  description,
  icon,
  open,
  size = "lg",
  title,
  variant = "dialog",
}: RoutePanelProps) {
  const router = useRouter();

  if (!open) {
    return null;
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      router.replace(closeHref, { scroll: false });
    }
  };

  const panelHeaderProps = {
    title,
    ...(badge !== undefined ? { badge } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(icon !== undefined ? { icon } : {}),
  } satisfies Pick<RoutePanelProps, "badge" | "description" | "icon" | "title">;

  if (variant === "drawer") {
    return (
      <Sheet onOpenChange={handleOpenChange} open={open}>
        <SheetContent
          className={cn(
            "w-full overflow-hidden p-0",
            drawerSizeClassNameMap[size],
          )}
          side="right"
        >
          <SheetHeader className="border-b border-border/70 px-6 py-5">
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <SheetDescription className="sr-only">
              {description ?? title}
            </SheetDescription>
            <PanelHeader {...panelHeaderProps} />
          </SheetHeader>
          <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className={cn(
          "overflow-hidden p-0",
          dialogSizeClassNameMap[size],
        )}
      >
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description ?? title}
          </DialogDescription>
          <PanelHeader {...panelHeaderProps} />
        </DialogHeader>
        <div className="app-scrollbar max-h-[calc(100vh-11rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
