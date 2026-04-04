import { z } from "zod";
import {
  integerField,
  optionalText,
  requiredEnum,
  requiredText,
} from "@/lib/validation";

export const roomSchema = z.object({
  building: optionalText("Tòa nhà", 120),
  capacity: integerField("Sức chứa", { max: 1000, min: 1 }),
  code: requiredText("Mã phòng", { max: 20, minLength: 2 }),
  id: z.string().uuid().optional(),
  name: requiredText("Tên phòng", { max: 120, minLength: 2 }),
  status: requiredEnum(["ACTIVE", "INACTIVE"], "Trạng thái"),
});

export type RoomInput = z.input<typeof roomSchema>;
