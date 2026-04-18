"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TableActionLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export function TableActionLink({
  href,
  icon,
  label,
  variant = "ghost",
}: TableActionLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        render={
          <Link
            className={cn(
              buttonVariants({ size: "icon-sm", variant }),
              "size-11 shrink-0 md:size-9",
            )}
            href={href}
          >
            {icon}
          </Link>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
