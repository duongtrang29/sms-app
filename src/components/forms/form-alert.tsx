"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ActionOutcomeStatus } from "@/types/app";

type FormAlertProps = {
  message?: string | undefined;
  status?: ActionOutcomeStatus | undefined;
  success?: boolean;
};

export function FormAlert({ message, status, success = false }: FormAlertProps) {
  if (!message) {
    return null;
  }

  const resolvedStatus = status ?? (success ? "success" : "failed");
  const variant =
    resolvedStatus === "success"
      ? "success"
      : resolvedStatus === "partial"
        ? "default"
        : "destructive";
  const title =
    resolvedStatus === "success"
      ? "Thành công"
      : resolvedStatus === "partial"
        ? "Cảnh báo"
        : "Thông báo";

  return (
    <Alert className={cn(resolvedStatus === "success" && "shadow-none")} variant={variant}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
