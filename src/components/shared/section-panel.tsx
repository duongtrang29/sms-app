import { cn } from "@/lib/utils";

type SectionPanelProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
  icon?: React.ReactNode;
  title?: string;
};

export function SectionPanel({
  actions,
  children,
  className,
  description,
  icon,
  title,
}: SectionPanelProps) {
  return (
    <section className={cn("app-subtle-surface p-4 md:p-5", className)}>
      {(title || description || actions) ? (
        <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title ? (
              <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
                {icon ? (
                  <span className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-muted/45 text-info-foreground">
                    {icon}
                  </span>
                ) : null}
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className={cn("text-sm text-muted-foreground", title ? "mt-1" : "")}>{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
