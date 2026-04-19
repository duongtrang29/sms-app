import { InboxIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  action?: React.ReactNode;
  description: string;
  icon?: React.ReactNode;
  tone?: "default" | "info";
  title: string;
};

export function EmptyState({
  action,
  description,
  icon,
  tone = "default",
  title,
}: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <div
        className={cn(
          "mx-auto inline-flex size-12 items-center justify-center rounded-lg border border-border bg-muted/45",
          tone === "info" ? "text-info-foreground" : "text-muted-foreground",
        )}
      >
        {icon ?? <InboxIcon className="size-5" />}
      </div>
      <h3 className="mt-4 text-base font-medium text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
