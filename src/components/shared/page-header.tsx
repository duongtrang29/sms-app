import { cn } from "@/lib/utils";

type PageHeaderProps = {
  actions?: React.ReactNode;
  badge?: string;
  className?: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  info?: string;
  title: string;
};

export function PageHeader({
  actions,
  badge,
  className,
  description,
  eyebrow,
  icon,
  info,
  title,
}: PageHeaderProps) {
  const helperText = description ?? info;

  return (
    <section className={cn("app-subtle-surface p-4 md:p-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          {(eyebrow || badge) ? (
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow ? (
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {eyebrow}
                </span>
              ) : null}
              {badge ? (
                <span className="rounded-full border border-border bg-muted/45 px-2 py-1 text-xs font-medium text-muted-foreground">
                  {badge}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex min-w-0 items-center gap-2">
            {icon ? (
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/45 text-info-foreground">
                {icon}
              </span>
            ) : null}
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          </div>

          {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
