"use client";

import { Loader2Icon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  pending?: boolean;
  className?: string;
};

export function SubmitButton({
  children,
  pending = false,
  className,
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const isPending = pending || formPending;

  return (
    <Button className={className} disabled={isPending} type="submit">
      {isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}
      {isPending ? "Đang xử lý" : children}
    </Button>
  );
}
