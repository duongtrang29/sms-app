"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type QueryToastProps = {
  error?: string | null | undefined;
  success?: string | null | undefined;
};

export function QueryToast({ error, success }: QueryToastProps) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) {
      return;
    }

    if (error) {
      toast.error(error);
      shownRef.current = true;
      return;
    }

    if (success) {
      toast.success(success);
      shownRef.current = true;
    }
  }, [error, success]);

  return null;
}
