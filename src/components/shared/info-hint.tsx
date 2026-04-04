"use client";

import { CircleHelpIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InfoHintProps = {
  className?: string;
  content: string;
};

export function InfoHint({ className, content }: InfoHintProps) {
  return (
    <TooltipProvider delay={120}>
      <Tooltip>
        <TooltipTrigger
          aria-label="Xem thêm thông tin"
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            className,
          )}
        >
          <CircleHelpIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm text-left text-[13px] leading-5">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
