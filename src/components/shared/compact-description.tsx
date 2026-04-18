import { getCompactCopy } from "@/lib/compact-copy";
import { cn } from "@/lib/utils";

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
  const { summary } = getCompactCopy(
    text,
    maxLength === undefined ? undefined : { maxLength },
  );

  if (!summary) {
    return null;
  }

  return (
    <p className={cn("min-w-0 truncate", className)}>{summary}</p>
  );
}
