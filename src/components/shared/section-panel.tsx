import { CompactDescription } from "@/components/shared/compact-description";
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
    <section className={cn("app-subtle-surface px-4 py-4 md:px-5 md:py-5", className)}>
      {title || description || actions ? (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title ? (
              <div className="flex items-center gap-2">
                {icon ? (
                  <span className="flex size-8 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground">
                    {icon}
                  </span>
                ) : null}
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              </div>
            ) : null}
            {description ? (
              <CompactDescription
                className={cn(
                  "mt-1 max-w-3xl text-sm text-muted-foreground",
                  title ? "pl-10" : "",
                )}
                maxLength={86}
                text={description}
              />
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
