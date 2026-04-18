"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-medium)] border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      size: {
        default: "h-11 px-4",
        lg: "h-12 px-5",
        sm: "h-10 px-3.5",
        xs: "h-8 px-3 text-xs",
        icon: "size-11",
        "icon-lg": "size-12",
        "icon-sm": "size-10",
        "icon-xs": "size-8",
      },
      tone: {
        primary:
          "border-primary bg-primary text-primary-foreground hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-primary/55",
        secondary:
          "border-border bg-card text-foreground hover:bg-muted active:bg-slate-100 disabled:bg-muted",
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted active:bg-slate-100",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-muted active:bg-slate-100",
        danger:
          "border-[color:var(--color-danger)] bg-[color:var(--color-danger)] text-white hover:bg-[#B91C1C] active:bg-[#991B1B]",
        success:
          "border-[color:var(--color-success)] bg-[color:var(--color-success)] text-white hover:bg-[#15803D] active:bg-[#166534]",
      },
    },
    defaultVariants: {
      size: "default",
      tone: "primary",
    },
  },
);

type ButtonVariant =
  | "default"
  | "destructive"
  | "ghost"
  | "link"
  | "outline"
  | "primary"
  | "secondary"
  | "success";

type ButtonSize = NonNullable<VariantProps<typeof buttonStyles>["size"]>;

type PrimitiveButtonProps = Omit<ButtonPrimitive.Props, "className"> & {
  className?: string | undefined;
};

function resolveTone(variant: ButtonVariant) {
  if (variant === "ghost") {
    return "ghost";
  }

  if (variant === "outline" || variant === "secondary" || variant === "link") {
    return "outline";
  }

  if (variant === "destructive") {
    return "danger";
  }

  if (variant === "success") {
    return "success";
  }

  return "primary";
}

function buttonVariants({
  className,
  size = "default",
  variant = "default",
}: {
  className?: string | undefined;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return cn(buttonStyles({ size, tone: resolveTone(variant) }), className);
}

function Button({
  className,
  pendingLabel = "Đang xử lý",
  variant = "default",
  size = "default",
  ...props
}: PrimitiveButtonProps & {
  pendingLabel?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  const { pending } = useFormStatus();
  const isSubmitIntent = props.type !== "button";
  const isDisabled = props.disabled || (isSubmitIntent && pending);
  const isIconOnly = typeof size === "string" && size.startsWith("icon");

  return (
    <ButtonPrimitive
      {...props}
      aria-busy={isSubmitIntent && pending}
      className={buttonVariants({ className, size, variant })}
      data-slot="button"
      disabled={isDisabled}
    >
      {pending && isSubmitIntent ? (
        <>
          <Loader2Icon
            aria-hidden="true"
            className="size-4 animate-spin"
            data-icon="inline-start"
          />
          {isIconOnly ? <span className="sr-only">{pendingLabel}</span> : pendingLabel}
        </>
      ) : (
        props.children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
