import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      {...props}
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-medium)] border border-input bg-background px-3 text-sm text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground hover:border-primary/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        "aria-invalid:border-[color:var(--color-danger)] aria-invalid:ring-2 aria-invalid:ring-[color:var(--color-danger)]/30",
        className,
      )}
      data-slot="input"
      type={type}
    />
  );
}

export { Input };
