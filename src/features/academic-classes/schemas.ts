import { z } from "zod";
import {
  integerField,
  requiredEnum,
  requiredText,
  uuidField,
} from "@/lib/validation";

export const academicClassSchema = z.object({
  code: requiredText("Mã lớp", { max: 30, minLength: 2 }),
  cohort_year: integerField("Khóa", { max: 2100, min: 2000 }),
  id: z.string().uuid().optional(),
  major_id: uuidField("Ngành"),
  name: requiredText("Tên lớp", { max: 120, minLength: 2 }),
  status: requiredEnum(["ACTIVE", "INACTIVE"], "Trạng thái"),
});

export type AcademicClassInput = z.input<typeof academicClassSchema>;
