"use client";

import { useEffect, useRef } from "react";
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
import { useMediaQuery } from "@/hooks/useMediaQuery";
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

const dialogSizeMap = {
  lg: "max-w-4xl",
  xl: "max-w-6xl",
} as const;

const drawerSizeMap = {
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

function PanelHeader({
  badge,
  description,
  icon,
  title,
}: {
  badge: string | undefined;
  description: string | undefined;
  icon: React.ReactNode | undefined;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? (
        <div className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-muted/45 text-info-foreground">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        {badge ? (
          <span className="rounded-full border border-border bg-muted/45 px-2 py-1 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
        ) : null}
        <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
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
  const isMobile = useMediaQuery("(max-width: 767px)");
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const container = contentRef.current;
    if (!container) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      window.setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 120);
    };

    container.addEventListener("focusin", handleFocusIn);

    return () => container.removeEventListener("focusin", handleFocusIn);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      router.replace(closeHref, { scroll: false });
    }
  };

  if (isMobile) {
    return (
      <Sheet onOpenChange={handleOpenChange} open={open}>
        <SheetContent
          className="z-40 max-h-[85vh] w-full rounded-t-2xl border-t p-0"
          side="bottom"
        >
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <SheetDescription className="sr-only">{description ?? title}</SheetDescription>
            <PanelHeader badge={badge} description={description} icon={icon} title={title} />
          </SheetHeader>
          <div
            className="touch-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4"
            ref={contentRef}
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (variant === "drawer") {
    return (
      <Sheet onOpenChange={handleOpenChange} open={open}>
        <SheetContent className={cn("w-full p-0", drawerSizeMap[size])} side="right">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <SheetDescription className="sr-only">{description ?? title}</SheetDescription>
            <PanelHeader badge={badge} description={description} icon={icon} title={title} />
          </SheetHeader>
          <div
            className="touch-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4"
            ref={contentRef}
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className={cn("max-h-[85vh] p-0", dialogSizeMap[size])}>
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description ?? title}</DialogDescription>
          <PanelHeader badge={badge} description={description} icon={icon} title={title} />
        </DialogHeader>
        <div className="touch-scroll max-h-[calc(85vh-88px)] overflow-y-auto px-5 py-4" ref={contentRef}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
