"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type FormAlertProps = {
  message?: string | undefined;
  success?: boolean;
};

export function FormAlert({ message, success = false }: FormAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert
      className={cn(success && "shadow-none")}
      variant={success ? "success" : "destructive"}
    >
      <AlertTitle>{success ? "Thành công" : "Thông báo"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
