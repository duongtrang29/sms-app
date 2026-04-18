"use client";

import type { ComponentProps } from "react";
import { Trash2Icon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type InlineActionField = {
  name: string;
  value: string;
};

type InlineActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  className?: string | undefined;
  confirmMessage?: string | undefined;
  fields?: InlineActionField[];
  icon?: React.ReactNode | undefined;
  iconOnly?: boolean;
  label: string;
  pendingLabel?: string | undefined;
  size?: ComponentProps<typeof Button>["size"];
  tooltip?: string | undefined;
  variant?: ComponentProps<typeof Button>["variant"];
};

type InlineActionSubmitButtonProps = {
  ariaLabel: string;
  icon: React.ReactNode;
  iconOnly: boolean;
  label: string;
  pendingLabel: string | undefined;
  size: NonNullable<ComponentProps<typeof Button>["size"]>;
  tooltip?: string | undefined;
  variant: NonNullable<ComponentProps<typeof Button>["variant"]>;
};

function InlineActionSubmitButton({
  ariaLabel,
  icon,
  iconOnly,
  label,
  pendingLabel,
  size,
  tooltip,
  variant,
}: InlineActionSubmitButtonProps) {
  const { pending } = useFormStatus();

  const button = (
    <Button
      aria-label={ariaLabel}
      disabled={pending}
      size={iconOnly ? "icon-sm" : size}
      type="submit"
      variant={variant}
    >
      {iconOnly ? icon : pending ? pendingLabel ?? "Đang xử lý" : label}
    </Button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger aria-label={ariaLabel} render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function InlineActionForm({
  action,
  className,
  confirmMessage,
  fields = [],
  icon = <Trash2Icon aria-hidden="true" className="size-4" />,
  iconOnly = false,
  label,
  pendingLabel,
  size = "xs",
  tooltip,
  variant = "outline",
}: InlineActionFormProps) {
  return (
    <form
      action={action}
      className={className ?? "inline-flex"}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {fields.map((field) => (
        <input
          key={`${field.name}:${field.value}`}
          name={field.name}
          type="hidden"
          value={field.value}
        />
      ))}
      <InlineActionSubmitButton
        ariaLabel={tooltip ?? label}
        icon={icon}
        iconOnly={iconOnly}
        label={label}
        pendingLabel={pendingLabel}
        size={size}
        tooltip={tooltip}
        variant={variant}
      />
    </form>
  );
}
