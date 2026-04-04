import { z } from "zod";
import { optionalText, requiredEnum, requiredText } from "@/lib/validation";

export const departmentSchema = z.object({
  code: requiredText("Mã khoa", { max: 20, minLength: 2 }),
  description: optionalText("Mô tả", 255),
  id: z.string().uuid().optional(),
  name: requiredText("Tên khoa", { max: 120, minLength: 2 }),
  status: requiredEnum(["ACTIVE", "INACTIVE"], "Trạng thái"),
});

export type DepartmentInput = z.input<typeof departmentSchema>;
