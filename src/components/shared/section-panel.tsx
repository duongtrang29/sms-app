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
    <section className={cn("rounded-lg border border-gray-200 bg-white p-4 md:p-5", className)}>
      {(title || description || actions) ? (
        <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title ? (
              <h2 className="flex items-center gap-2 text-base font-medium text-gray-900">
                {icon ? (
                  <span className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-blue-600">
                    {icon}
                  </span>
                ) : null}
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className={cn("text-sm text-gray-700", title ? "mt-1" : "")}>{description}</p>
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
