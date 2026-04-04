import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactDescription } from "@/components/shared/compact-description";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FormPanelCardProps = {
  children: React.ReactNode;
  className?: string | undefined;
  description?: string | undefined;
  title: string;
};

type FormSectionProps = {
  children: React.ReactNode;
  className?: string | undefined;
  description?: string | undefined;
  title: string;
};

type FormGridProps = {
  children: React.ReactNode;
  className?: string | undefined;
  columns?: 2 | 3;
};

type FormCardSkeletonProps = {
  className?: string | undefined;
  sections?: number;
  title: string;
};

export function FormPanelCard({
  children,
  className,
  description,
  title,
}: FormPanelCardProps) {
  return (
    <Card
      className={cn(
        "h-fit overflow-hidden rounded-[30px] border-border/70 bg-background/92 shadow-[0_22px_64px_-44px_rgba(18,33,59,0.24)]",
        className,
      )}
    >
      <CardHeader className="gap-2 border-b border-border/60 bg-muted/[0.18] px-5 py-5 md:px-7 md:py-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          Biểu mẫu
        </div>
        <CardTitle className="text-[1.12rem] tracking-tight">{title}</CardTitle>
        {description ? (
          <CompactDescription
            className="text-sm text-muted-foreground"
            maxLength={78}
            text={description}
          />
        ) : null}
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-5 md:px-7 md:pb-7 md:pt-7">
        {children}
      </CardContent>
    </Card>
  );
}

export function FormContainer({
  children,
  className,
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-9", className)}>
      {children}
    </div>
  );
}

export function FormSection({
  children,
  className,
  description,
  title,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "space-y-5 border-t border-border/60 pt-7 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <CompactDescription
            className="max-w-3xl text-sm text-muted-foreground"
            maxLength={74}
            text={description}
          />
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function FormGrid({
  children,
  className,
  columns = 2,
}: FormGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:gap-5",
        columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormStickyFooter({
  children,
  className,
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-8 flex flex-col gap-3 border-t border-border/70 bg-background/96 pt-5 backdrop-blur supports-[backdrop-filter]:bg-background/90 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormCardSkeleton({
  className,
  sections = 2,
  title,
}: FormCardSkeletonProps) {
  return (
    <FormPanelCard className={className} title={title}>
      <div className="space-y-6">
        {Array.from({ length: sections }).map((_, sectionIndex) => (
          <div
            key={`form-skeleton-${sectionIndex + 1}`}
            className="space-y-4 border-t border-border/60 pt-6 first:border-t-0 first:pt-0"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-14 flex-1" />
          <Skeleton className="h-11 w-full md:w-44" />
        </div>
      </div>
    </FormPanelCard>
  );
}
