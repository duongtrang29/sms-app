import { ZodError, type ZodType } from "zod";

import type { ActionState } from "@/types/app";

export const initialActionState: ActionState = {
  success: false,
};

export function getFieldErrors(error: ZodError) {
  const fieldErrors = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([field, messages]) =>
      messages?.length ? [[field, [...messages]]] : [],
    ),
  ) as Record<string, string[]>;
}

export function failure<T = void>(
  message: string,
  errors?: Record<string, string[]>,
): ActionState<T> {
  return {
    errors,
    message,
    success: false,
  };
}

export function success<T = void>(message: string, data?: T): ActionState<T> {
  return {
    data,
    message,
    success: true,
  };
}

export function parseWithSchema<T>(
  schema: ZodType<T>,
  payload: FormData | Record<string, unknown>,
) {
  const rawPayload =
    payload instanceof FormData ? Object.fromEntries(payload.entries()) : payload;
  const result = schema.safeParse(rawPayload);

  if (!result.success) {
    return {
      data: null,
      errors: getFieldErrors(result.error),
      success: false as const,
    };
  }

  return {
    data: result.data,
    errors: undefined,
    success: true as const,
  };
}
