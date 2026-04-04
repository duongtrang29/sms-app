import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[0.72rem] font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-primary/12 bg-primary text-primary-foreground shadow-[0_10px_24px_-18px_rgba(67,92,230,0.7)] [a]:hover:bg-primary/92",
        secondary:
          "border-border/60 bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        success:
          "border-[color:var(--color-success)]/10 bg-[color:var(--color-success-soft)] text-[color:var(--color-success-foreground)] [a]:hover:bg-[color:var(--color-success-soft)]/80",
        warning:
          "border-[color:var(--color-warning)]/10 bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning-foreground)] [a]:hover:bg-[color:var(--color-warning-soft)]/80",
        info:
          "border-[color:var(--color-info)]/10 bg-[color:var(--color-info-soft)] text-[color:var(--color-info-foreground)] [a]:hover:bg-[color:var(--color-info-soft)]/80",
        neutral:
          "border-[color:var(--color-neutral)]/10 bg-[color:var(--color-neutral-soft)] text-[color:var(--color-neutral-foreground)] [a]:hover:bg-[color:var(--color-neutral-soft)]/80",
        destructive:
          "border-[color:var(--color-danger)]/10 bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-foreground)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-[color:var(--color-danger-soft)]/80",
        outline:
          "border-border/80 bg-background/75 text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

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
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
