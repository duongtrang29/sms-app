import { z } from "zod";
import {
  requiredEnum,
  requiredText,
  uuidField,
} from "@/lib/validation";

export const majorSchema = z.object({
  code: requiredText("Mã ngành", { max: 20, minLength: 2 }),
  degree_level: requiredText("Bậc đào tạo", { max: 40, minLength: 2 }),
  department_id: uuidField("Khoa"),
  id: z.string().uuid().optional(),
  name: requiredText("Tên ngành", { max: 120, minLength: 2 }),
  status: requiredEnum(["ACTIVE", "INACTIVE"], "Trạng thái"),
});

export type MajorInput = z.input<typeof majorSchema>;
