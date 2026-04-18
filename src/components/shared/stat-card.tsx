import { cn } from "@/lib/utils";

type StatCardProps = {
  description: string;
  icon?: React.ReactNode;
  label: string;
  tone?: "danger" | "info" | "neutral" | "primary" | "success" | "warning";
  value: React.ReactNode;
};

const toneClassMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  danger: "border-red-200 bg-red-50",
  info: "border-blue-200 bg-blue-50",
  neutral: "border-gray-200 bg-white",
  primary: "border-blue-200 bg-blue-50",
  success: "border-green-200 bg-green-50",
  warning: "border-amber-200 bg-amber-50",
};

const dotClassMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  danger: "bg-red-600",
  info: "bg-blue-600",
  neutral: "bg-gray-500",
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
    <article className={cn("rounded-lg border p-4", toneClassMap[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span className={cn("inline-block size-2 rounded-full", dotClassMap[tone])} />
          {label}
        </p>
        {icon ? (
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 bg-white text-blue-600">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-700">{description}</p>
    </article>
  );
}
