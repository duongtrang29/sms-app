import { cn } from "@/lib/utils";

type InfoHintProps = {
  className?: string;
  content: string;
};

export function InfoHint({ className, content }: InfoHintProps) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>{content}</p>
  );
}
