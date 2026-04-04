import { z } from "zod";
import {
  integerField,
  numberField,
  optionalText,
  requiredDateTime,
  requiredEnum,
  requiredText,
  uuidField,
} from "@/lib/validation";

export const courseOfferingSchema = z
  .object({
    attendance_weight: numberField("Trọng số chuyên cần", { max: 100, min: 0 }),
    course_id: uuidField("Môn học"),
    final_weight: numberField("Trọng số cuối kỳ", { max: 100, min: 0 }),
    id: z.string().uuid().optional(),
    lecturer_id: z.string().uuid("Giảng viên không hợp lệ.").optional(),
    max_capacity: integerField("Sĩ số tối đa", { max: 500, min: 1 }),
    midterm_weight: numberField("Trọng số giữa kỳ", { max: 100, min: 0 }),
    notes: optionalText("Ghi chú", 500),
    passing_score: numberField("Điểm đạt", { max: 10, min: 0 }),
    registration_close_at: requiredDateTime("Ngày đóng đăng ký"),
    registration_open_at: requiredDateTime("Ngày mở đăng ký"),
    section_code: requiredText("Mã nhóm", { max: 20 }),
    semester_id: uuidField("Học kỳ"),
    status: requiredEnum(
      ["DRAFT", "OPEN", "CLOSED", "FINISHED", "CANCELLED"],
      "Trạng thái",
    ),
    title: optionalText("Tiêu đề", 150),
  })
  .superRefine((value, ctx) => {
    const totalWeight =
      value.attendance_weight + value.midterm_weight + value.final_weight;

    if (totalWeight !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tổng trọng số chuyên cần, giữa kỳ và cuối kỳ phải bằng 100.",
        path: ["final_weight"],
      });
    }

    if (value.registration_close_at <= value.registration_open_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày đóng đăng ký phải sau ngày mở đăng ký.",
        path: ["registration_close_at"],
      });
    }
  });

export type CourseOfferingInput = z.input<typeof courseOfferingSchema>;
