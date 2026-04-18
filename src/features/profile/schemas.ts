import { z } from "zod";

const phoneRegex = /^[0-9+\-\s().]*$/;

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Họ tên phải có ít nhất 2 ký tự.")
    .max(120, "Họ tên không được vượt quá 120 ký tự."),
  phone: z
    .string()
    .trim()
    .max(20, "Số điện thoại không được vượt quá 20 ký tự.")
    .regex(phoneRegex, "Số điện thoại chỉ được chứa chữ số và ký tự + - ( ) .")
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
