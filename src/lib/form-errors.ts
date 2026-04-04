"use client";

import { useEffect } from "react";
import type {
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";

type ServerFieldRule = {
  field: string;
  message: string;
  test: RegExp | string | Array<RegExp | string>;
};

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

export function matchServerFieldErrors(
  sourceMessage: string | undefined,
  rules: ServerFieldRule[],
): Record<string, string[]> | undefined {
  if (!sourceMessage) {
    return undefined;
  }

  const normalizedMessage = sourceMessage.toLowerCase();
  const matches = rules.flatMap((rule) => {
    const tests = Array.isArray(rule.test) ? rule.test : [rule.test];
    const matched = tests.some((test) => {
      if (typeof test === "string") {
        return normalizedMessage.includes(test.toLowerCase());
      }

      return test.test(sourceMessage);
    });

    if (!matched) {
      return [];
    }

    return [[rule.field, [rule.message] as string[]]];
  });

  if (!matches.length) {
    return undefined;
  }

  return Object.fromEntries(matches) as Record<string, string[]>;
}
