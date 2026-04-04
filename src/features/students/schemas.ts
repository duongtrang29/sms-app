import { z } from "zod";
import {
  integerField,
  optionalText,
  requiredEmail,
  requiredEnum,
  requiredText,
  uuidField,
} from "@/lib/validation";

export const studentSchema = z.object({
  academic_class_id: uuidField("Lớp sinh hoạt"),
  access_status: requiredEnum(["ACTIVE", "INACTIVE", "LOCKED"], "Trạng thái truy cập"),
  address: optionalText("Địa chỉ", 255),
  current_status: requiredEnum(
    ["ACTIVE", "SUSPENDED", "GRADUATED", "DROPPED"],
    "Trạng thái học tập",
  ),
  date_of_birth: z.string().trim().optional(),
  email: requiredEmail(),
  emergency_contact: optionalText("Liên hệ khẩn cấp", 120),
  enrollment_year: integerField("Năm nhập học", { max: 2100, min: 2000 }),
  full_name: requiredText("Họ tên", { max: 120, minLength: 2 }),
  gender: requiredEnum(["MALE", "FEMALE", "OTHER"], "Giới tính").optional(),
  id: z.string().uuid().optional(),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
    .max(100, "Mật khẩu không được vượt quá 100 ký tự.")
    .optional(),
  phone: optionalText("Số điện thoại", 20),
  student_code: requiredText("MSSV", { max: 30, minLength: 2 }),
});

export type StudentInput = z.input<typeof studentSchema>;
