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
    <section className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
      <div
        className={cn(
          "mx-auto inline-flex size-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50",
          tone === "info" ? "text-blue-600" : "text-gray-500",
        )}
      >
        {icon ?? <InboxIcon className="size-5" />}
      </div>
      <h3 className="mt-4 text-base font-medium text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-700">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
