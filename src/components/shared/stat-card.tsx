import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactDescription } from "@/components/shared/compact-description";
import { cn } from "@/lib/utils";

type StatCardProps = {
  description: string;
  label: string;
  tone?: "danger" | "info" | "neutral" | "primary" | "success" | "warning";
  value: React.ReactNode;
};

const toneClassMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  danger:
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,244,244,0.92))]",
  info:
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(242,248,255,0.95))]",
  neutral:
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,248,251,0.95))]",
  primary:
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,243,255,0.95))]",
  success:
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,250,246,0.95))]",
  warning:
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,249,237,0.95))]",
};

const dotClassMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  danger: "bg-[color:var(--color-danger)]",
  info: "bg-[color:var(--color-info)]",
  neutral: "bg-[color:var(--color-neutral)]",
  primary: "bg-primary",
  success: "bg-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning)]",
};

export function StatCard({
  description,
  label,
  tone = "primary",
  value,
}: StatCardProps) {
  return (
    <Card className={cn("shadow-none", toneClassMap[tone])} size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className={cn("app-status-dot", dotClassMap[tone])} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
          {value}
        </div>
        <CompactDescription
          className="text-sm text-muted-foreground"
          maxLength={52}
          text={description}
        />
      </CardContent>
    </Card>
  );
}
