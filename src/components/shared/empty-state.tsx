import { InboxIcon } from "lucide-react";

import { CompactDescription } from "@/components/shared/compact-description";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

type EmptyStateProps = {
  action?: React.ReactNode;
  description: string;
  icon?: React.ReactNode;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <Empty className="rounded-[26px] border border-dashed border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,248,253,0.94))] px-6 py-10 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.16)]">
      <EmptyHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-white/85 text-[color:var(--color-info-foreground)] shadow-[0_10px_22px_-18px_rgba(46,77,175,0.38)]">
          {icon ?? <InboxIcon className="size-5" />}
        </div>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          <CompactDescription
            className="mx-auto max-w-xl justify-center text-center"
            maxLength={70}
            text={description}
          />
        </EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : <EmptyContent />}
    </Empty>
  );
}
