"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createClient } from "@/lib/supabase/server";
import { scheduleSchema } from "@/features/schedules/schemas";
import type { ActionState } from "@/types/app";

const scheduleOverlapRules = [
  {
    field: "room_id",
    message: "Phòng học đang bị trùng lịch trong khung giờ này.",
    test: [
      "schedules_room_overlap_excl",
      "exclude_room_schedule_overlap",
      "conflicting key value violates exclusion constraint",
    ],
  },
  {
    field: "start_time",
    message: "Khung giờ học không hợp lệ hoặc đang bị trùng.",
    test: [
      "schedules_room_overlap_excl",
      "exclude_room_schedule_overlap",
      "time_range",
    ],
  },
];

export async function upsertScheduleAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const parsed = parseWithSchema(scheduleSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin lịch học chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const payload = {
    course_offering_id: parsed.data.course_offering_id,
    day_of_week: parsed.data.day_of_week,
    end_date: parsed.data.end_date || null,
    end_time: parsed.data.end_time,
    note: parsed.data.note || null,
    room_id: parsed.data.room_id || null,
    start_date: parsed.data.start_date || null,
    start_time: parsed.data.start_time,
    week_pattern: parsed.data.week_pattern || "ALL",
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("schedules")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(
        error.message,
        scheduleOverlapRules,
      );

      return failure(
        fieldErrors
          ? Object.values(fieldErrors)[0]?.[0] ?? error.message
          : error.message || "Không thể cập nhật lịch học.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "SCHEDULE_UPDATED",
      entityId: parsed.data.id,
      entityType: "schedules",
    });
  } else {
    const { data, error } = await supabase
      .from("schedules")
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      const fieldErrors = matchServerFieldErrors(
        error.message,
        scheduleOverlapRules,
      );

      return failure(
        fieldErrors
          ? Object.values(fieldErrors)[0]?.[0] ?? error.message
          : error.message || "Không thể tạo lịch học.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "SCHEDULE_CREATED",
      entityId: (data as { id: string }).id,
      entityType: "schedules",
    });
  }

  revalidatePath("/admin/schedules");
  redirect("/admin/schedules");
}
