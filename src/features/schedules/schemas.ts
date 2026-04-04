import { z } from "zod";
import {
  integerField,
  optionalText,
  requiredDateTime,
  requiredText,
  uuidField,
} from "@/lib/validation";

export const scheduleSchema = z
  .object({
    course_offering_id: uuidField("Học phần"),
    day_of_week: integerField("Thứ", { max: 7, min: 1 }),
    end_date: z.string().trim().optional(),
    end_time: requiredDateTime("Giờ kết thúc"),
    id: z.string().uuid().optional(),
    note: optionalText("Ghi chú", 255),
    room_id: z.string().uuid("Phòng học không hợp lệ.").optional(),
    start_date: z.string().trim().optional(),
    start_time: requiredDateTime("Giờ bắt đầu"),
    week_pattern: requiredText("Chu kỳ tuần", { max: 20 }).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.end_time <= value.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Giờ kết thúc phải sau giờ bắt đầu.",
        path: ["end_time"],
      });
    }

    if (value.start_date && value.end_date && value.end_date < value.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày kết thúc phải sau hoặc bằng ngày hiệu lực.",
        path: ["end_date"],
      });
    }
  });

export type ScheduleInput = z.input<typeof scheduleSchema>;
