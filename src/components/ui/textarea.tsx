import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-[var(--radius-medium)] border border-input bg-background px-4 py-3 text-body transition-colors outline-none",
        "placeholder:text-muted-foreground hover:border-primary/45 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35",
        "disabled:cursor-not-allowed disabled:bg-muted/45 disabled:text-muted-foreground",
        "aria-invalid:border-[color:var(--color-danger)] aria-invalid:ring-2 aria-invalid:ring-[color:var(--color-danger)]/25",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
