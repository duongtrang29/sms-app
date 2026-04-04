import { z } from "zod";
import {
  integerField,
  optionalDateTime,
  requiredDateTime,
  requiredEnum,
  requiredText,
} from "@/lib/validation";

export const semesterSchema = z
  .object({
    academic_year: requiredText("Năm học", { max: 20, minLength: 4 }),
    code: requiredText("Mã học kỳ", { max: 20, minLength: 2 }),
    end_date: requiredDateTime("Ngày kết thúc"),
    enrollment_end: requiredDateTime("Ngày đóng đăng ký"),
    enrollment_start: requiredDateTime("Ngày mở đăng ký"),
    id: z.string().uuid().optional(),
    is_current: requiredEnum(["YES", "NO"], "Học kỳ hiện hành"),
    max_credits: integerField("Tín chỉ tối đa", { max: 30, min: 1 }),
    name: requiredText("Tên học kỳ", { max: 120, minLength: 2 }),
    regrade_close_at: optionalDateTime("Ngày đóng phúc khảo"),
    regrade_open_at: optionalDateTime("Ngày mở phúc khảo"),
    start_date: requiredDateTime("Ngày bắt đầu"),
  })
  .superRefine((value, ctx) => {
    if (value.end_date < value.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
        path: ["end_date"],
      });
    }

    if (value.enrollment_end <= value.enrollment_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày đóng đăng ký phải sau ngày mở đăng ký.",
        path: ["enrollment_end"],
      });
    }

    if (value.regrade_open_at && value.regrade_close_at) {
      if (value.regrade_close_at <= value.regrade_open_at) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ngày đóng phúc khảo phải sau ngày mở phúc khảo.",
          path: ["regrade_close_at"],
        });
      }
    }
  });

export type SemesterInput = z.input<typeof semesterSchema>;
