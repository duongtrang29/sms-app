import { getCompactCopy } from "@/lib/compact-copy";
import { cn } from "@/lib/utils";
import { InfoHint } from "@/components/shared/info-hint";

type CompactDescriptionProps = {
  className?: string;
  maxLength?: number;
  text?: string;
};

export function CompactDescription({
  className,
  maxLength,
  text,
}: CompactDescriptionProps) {
  const { details, summary } = getCompactCopy(
    text,
    maxLength === undefined ? undefined : { maxLength },
  );

  if (!summary) {
    return null;
  }

  return (
    <div className={cn("flex min-w-0 items-start gap-2", className)}>
      <p className="min-w-0 flex-1 truncate">{summary}</p>
      {details ? <InfoHint content={details} /> : null}
    </div>
  );
}
