import { cn } from "@/lib/utils";

type StatCardProps = {
  description: string;
  icon?: React.ReactNode;
  label: string;
  tone?: "danger" | "info" | "neutral" | "primary" | "success" | "warning";
  value: React.ReactNode;
};

const toneClassMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  danger: "border-[color:var(--color-danger)]/25 bg-[color:var(--color-danger-soft)]/65",
  info: "border-[color:var(--color-info)]/25 bg-[color:var(--color-info-soft)]/65",
  neutral: "border-border bg-card",
  primary: "border-primary/25 bg-accent/75",
  success: "border-[color:var(--color-success)]/25 bg-[color:var(--color-success-soft)]/65",
  warning: "border-[color:var(--color-warning)]/25 bg-[color:var(--color-warning-soft)]/65",
};

const dotClassMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  danger: "bg-red-600",
  info: "bg-blue-600",
  neutral: "bg-[color:var(--color-neutral)]",
  primary: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-amber-600",
};

export function StatCard({
  description,
  icon,
  label,
  tone = "primary",
  value,
}: StatCardProps) {
  return (
    <article className={cn("rounded-lg border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]", toneClassMap[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className={cn("inline-block size-2 rounded-full", dotClassMap[tone])} />
          {label}
        </p>
        {icon ? (
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-card text-info-foreground">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </article>
  );
}
