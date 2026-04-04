"use client";

import { Loader2Icon } from "lucide-react";

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
  return (
    <Button className={className} disabled={pending} type="submit">
      {pending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}
      {pending ? "Đang xử lý" : children}
    </Button>
  );
}
