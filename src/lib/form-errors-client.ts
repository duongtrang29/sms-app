"use client";

import { useEffect } from "react";
import type {
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";

export function useApplyServerFormErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues, unknown, FieldValues | undefined>,
  errors?: Record<string, string[]>,
) {
  useEffect(() => {
    if (!errors) {
      return;
    }

    Object.entries(errors).forEach(([field, messages]) => {
      const message = messages.find(Boolean);

      if (!message) {
        return;
      }

      form.setError(field as Path<TFieldValues>, {
        type: "server",
        message,
      });
    });
  }, [errors, form]);

  useEffect(() => {
    if (!errors) {
      return;
    }

    const subscription = form.watch((_value, info) => {
      const fieldName = info.name;

      if (!fieldName || !errors[fieldName]) {
        return;
      }

      if (form.getFieldState(fieldName as Path<TFieldValues>).error?.type === "server") {
        form.clearErrors(fieldName as Path<TFieldValues>);
      }
    });

    return () => subscription.unsubscribe();
  }, [errors, form]);
}
