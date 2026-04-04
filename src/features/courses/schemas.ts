import { z } from "zod";
import {
  integerField,
  optionalText,
  requiredEnum,
  requiredText,
  uuidField,
} from "@/lib/validation";

export const courseSchema = z.object({
  code: requiredText("Mã môn", { max: 20, minLength: 2 }),
  credit_hours: integerField("Số tín chỉ", { max: 10, min: 1 }),
  department_id: uuidField("Khoa"),
  description: optionalText("Mô tả", 500),
  id: z.string().uuid().optional(),
  name: requiredText("Tên môn", { max: 120, minLength: 2 }),
  prerequisite_codes: z.string().trim().optional(),
  status: requiredEnum(["ACTIVE", "INACTIVE"], "Trạng thái"),
  total_sessions: integerField("Số buổi", { max: 45, min: 1 }),
});

export type CourseInput = z.input<typeof courseSchema>;
