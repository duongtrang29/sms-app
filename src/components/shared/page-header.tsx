import { InfoHint } from "@/components/shared/info-hint";
import { CompactDescription } from "@/components/shared/compact-description";
import { Badge } from "@/components/ui/badge";
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
  return (
    <div
      className={cn(
        "app-page-accent relative overflow-hidden rounded-[30px] border border-border/70 px-5 py-5 shadow-[0_26px_60px_-44px_rgba(20,37,63,0.28)] md:px-6 md:py-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.85),transparent_60%)] md:block" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex max-w-4xl items-start gap-4">
          {icon ? (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-[color:var(--color-info-foreground)] shadow-[0_18px_32px_-24px_rgba(46,77,175,0.38)]">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 space-y-2">
            {eyebrow || badge ? (
              <div className="flex flex-wrap items-center gap-2">
                {eyebrow ? (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-info-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                    <span className="app-status-dot bg-[color:var(--color-primary)]" />
                    {eyebrow}
                  </div>
                ) : null}
                {badge ? (
                  <Badge className="bg-white/90 text-foreground shadow-none" variant="outline">
                    {badge}
                  </Badge>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-start gap-2">
              <h1 className="text-3xl font-semibold tracking-[-0.05em] text-balance text-foreground md:text-[2.05rem]">
                {title}
              </h1>
              {info && !description ? <InfoHint className="mt-1" content={info} /> : null}
            </div>
            {description ? (
              <div className="flex items-start gap-2">
                <CompactDescription
                  className="max-w-3xl text-sm text-muted-foreground"
                  maxLength={78}
                  text={description}
                />
                {info ? <InfoHint content={info} /> : null}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
