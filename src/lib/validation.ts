import { z } from "zod";

export function requiredText(
  label: string,
  options?: {
    max?: number;
    minLength?: number;
  },
) {
  const minLength = options?.minLength ?? 1;
  let schema = z
    .string()
    .trim()
    .min(1, `${label} không được để trống.`);

  if (minLength > 1) {
    schema = schema.min(minLength, `${label} phải có ít nhất ${minLength} ký tự.`);
  }

  if (options?.max) {
    schema = schema.max(
      options.max,
      `${label} không được vượt quá ${options.max} ký tự.`,
    );
  }

  return schema;
}

export function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} không được vượt quá ${max} ký tự.`)
    .optional();
}

export function requiredEmail(label = "Email") {
  return z
    .string()
    .trim()
    .min(1, `${label} không được để trống.`)
    .email(`${label} không đúng định dạng.`);
}

export function uuidField(label: string) {
  return z.string().uuid(`${label} không hợp lệ.`);
}

export function integerField(
  label: string,
  options: {
    max: number;
    min: number;
  },
) {
  return z
    .union([
      z.number(),
      z
        .string()
        .trim()
        .min(1, `${label} không được để trống.`),
    ])
    .transform((value, ctx) => {
      const numericValue =
        typeof value === "number" ? value : Number(value);

      if (!Number.isFinite(numericValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải là số hợp lệ.`,
        });
        return z.NEVER;
      }

      if (!Number.isInteger(numericValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải là số nguyên.`,
        });
        return z.NEVER;
      }

      if (numericValue < options.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải lớn hơn hoặc bằng ${options.min}.`,
        });
        return z.NEVER;
      }

      if (numericValue > options.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải nhỏ hơn hoặc bằng ${options.max}.`,
        });
        return z.NEVER;
      }

      return numericValue;
    });
}

export function numberField(
  label: string,
  options: {
    max: number;
    min: number;
  },
) {
  return z
    .union([
      z.number(),
      z
        .string()
        .trim()
        .min(1, `${label} không được để trống.`),
    ])
    .transform((value, ctx) => {
      const numericValue =
        typeof value === "number" ? value : Number(value);

      if (!Number.isFinite(numericValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải là số hợp lệ.`,
        });
        return z.NEVER;
      }

      if (numericValue < options.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải lớn hơn hoặc bằng ${options.min}.`,
        });
        return z.NEVER;
      }

      if (numericValue > options.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải nhỏ hơn hoặc bằng ${options.max}.`,
        });
        return z.NEVER;
      }

      return numericValue;
    });
}

export function optionalDateTime(_label: string) {
  void _label;
  return z.string().trim().optional();
}

export function requiredDateTime(label: string) {
  return z.string().trim().min(1, `${label} không được để trống.`);
}

export function requiredEnum<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
  label: string,
) {
  return z.enum(values, {
    error: () => ({ message: `${label} không hợp lệ.` }),
  });
}
