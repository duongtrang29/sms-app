import { CompactDescription } from "@/components/shared/compact-description";

type PageHeaderProps = {
  actions?: React.ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  description,
  eyebrow = "Không gian làm việc",
  title,
}: PageHeaderProps) {
  return (
    <div className="app-page-accent relative overflow-hidden rounded-[28px] border border-border/70 px-5 py-5 shadow-[0_26px_60px_-44px_rgba(20,37,63,0.28)] md:px-6 md:py-6">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.85),transparent_60%)] md:block" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-3xl flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-info-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          <span className="app-status-dot bg-[color:var(--color-primary)]" />
          {eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-foreground md:text-[2.15rem]">
          {title}
        </h1>
        {description ? (
          <CompactDescription
            className="max-w-2xl text-sm text-muted-foreground"
            maxLength={84}
            text={description}
          />
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
      </div>
    </div>
  );
}
