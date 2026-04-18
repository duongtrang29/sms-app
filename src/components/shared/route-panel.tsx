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
        <div className="inline-flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-blue-600">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        {badge ? (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500">
            {badge}
          </span>
        ) : null}
        <h2 className="mt-1 text-base font-medium text-gray-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-gray-700">{description}</p> : null}
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

  if (variant === "drawer") {
    return (
      <Sheet onOpenChange={handleOpenChange} open={open}>
        <SheetContent className={cn("w-full p-0", drawerSizeMap[size])} side="right">
          <SheetHeader className="border-b border-gray-200 px-5 py-4">
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <SheetDescription className="sr-only">{description ?? title}</SheetDescription>
            <PanelHeader badge={badge} description={description} icon={icon} title={title} />
          </SheetHeader>
          <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className={cn("p-0", dialogSizeMap[size])}>
        <DialogHeader className="border-b border-gray-200 px-5 py-4">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description ?? title}</DialogDescription>
          <PanelHeader badge={badge} description={description} icon={icon} title={title} />
        </DialogHeader>
        <div className="app-scrollbar max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
