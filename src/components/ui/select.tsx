"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group className={cn("p-1", className)} data-slot="select-group" {...props} />;
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value className={cn("flex flex-1 text-left", className)} data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 rounded-[var(--radius-medium)] border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors",
        "hover:border-primary/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        size === "sm" ? "h-10" : "h-11",
        className,
      )}
      data-size={size}
      data-slot="select-trigger"
    >
      {children}
      <SelectPrimitive.Icon render={<ChevronDownIcon className="size-4 text-muted-foreground" />} />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        className="z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          {...props}
          className={cn(
            "max-h-80 min-w-40 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-[var(--shadow-dropdown)]",
            className,
          )}
          data-slot="select-content"
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn("px-2 py-1 text-xs font-medium text-muted-foreground", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      {...props}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-2 text-sm text-foreground outline-none",
        "focus:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      data-slot="select-item"
    >
      <SelectPrimitive.ItemText className="flex-1">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator render={<span className="absolute right-2" />}>
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return <SelectPrimitive.Separator className={cn("my-1 h-px bg-border", className)} data-slot="select-separator" {...props} />;
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      {...props}
      className={cn("flex items-center justify-center py-1", className)}
      data-slot="select-scroll-up-button"
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      {...props}
      className={cn("flex items-center justify-center py-1", className)}
      data-slot="select-scroll-down-button"
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
