import { z } from "zod";
import {
  optionalText,
  requiredEmail,
  requiredText,
} from "@/lib/validation";

const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
  .max(100, "Mật khẩu không được vượt quá 100 ký tự.");

export const loginSchema = z.object({
  email: requiredEmail(),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: requiredEmail(),
});

export const resetPasswordSchema = z
  .object({
    confirmPassword: passwordSchema,
    password: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  avatar_url: z.url("Đường dẫn ảnh đại diện không hợp lệ.").or(z.literal("")).optional(),
  full_name: requiredText("Họ tên", { max: 120, minLength: 2 }),
  phone: optionalText("Số điện thoại", 20),
});

export type LoginInput = z.input<typeof loginSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
