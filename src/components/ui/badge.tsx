import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground",
        secondary: "border-border bg-muted text-foreground",
        success:
          "border-[color:var(--color-success)]/30 bg-[color:var(--color-success-soft)] text-[color:var(--color-success-foreground)]",
        warning:
          "border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning-foreground)]",
        info:
          "border-[color:var(--color-info)]/30 bg-[color:var(--color-info-soft)] text-[color:var(--color-info-foreground)]",
        neutral:
          "border-[color:var(--color-neutral)]/30 bg-[color:var(--color-neutral-soft)] text-[color:var(--color-neutral-foreground)]",
        violet:
          "border-purple-300 bg-purple-100 text-purple-800",
        destructive:
          "border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-foreground)]",
        outline: "border-border bg-card text-foreground",
        ghost: "border-transparent bg-transparent text-muted-foreground",
        link: "border-transparent px-0 text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
