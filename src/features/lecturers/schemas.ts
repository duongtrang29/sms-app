import { z } from "zod";
import {
  optionalText,
  requiredEmail,
  requiredEnum,
  requiredText,
  uuidField,
} from "@/lib/validation";

export const lecturerSchema = z.object({
  academic_title: optionalText("Học hàm / học vị", 100),
  department_id: uuidField("Khoa"),
  email: requiredEmail(),
  employee_code: requiredText("Mã giảng viên", { max: 30, minLength: 2 }),
  full_name: requiredText("Họ tên", { max: 120, minLength: 2 }),
  hire_date: z.string().trim().optional(),
  id: z.string().uuid().optional(),
  office_location: optionalText("Phòng làm việc", 120),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
    .max(100, "Mật khẩu không được vượt quá 100 ký tự.")
    .optional(),
  phone: optionalText("Số điện thoại", 20),
  status: requiredEnum(["ACTIVE", "INACTIVE", "LOCKED"], "Trạng thái"),
});

export type LecturerInput = z.input<typeof lecturerSchema>;
