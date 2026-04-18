"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import {
  buildPathWithUpdates,
  getSafeReturnPath,
  getStringField,
} from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { parseSupabaseError } from "@/lib/errors";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { roomSchema } from "@/features/rooms/schemas";
import type { ActionState } from "@/types/app";

function redirectToRooms(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertRoomAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getSafeReturnPath(formData, "/admin/rooms", "/admin/rooms");
  const parsed = parseWithSchema(roomSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin phòng học chưa hợp lệ.", parsed.errors);
  }

  const supabase = createAdminClient();
  const payload = {
    building: parsed.data.building || null,
    capacity: parsed.data.capacity,
    code: parsed.data.code.toUpperCase(),
    is_active: parsed.data.status === "ACTIVE",
    name: parsed.data.name,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("rooms")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã phòng đã tồn tại.",
          test: ["rooms_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ??
          parseSupabaseError(error, "Không thể cập nhật phòng học."),
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "ROOM_UPDATED",
      entityId: parsed.data.id,
      entityType: "rooms",
    });
  } else {
    const { data, error } = await supabase
      .from("rooms")
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã phòng đã tồn tại.",
          test: ["rooms_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ??
          parseSupabaseError(error, "Không thể tạo phòng học."),
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "ROOM_CREATED",
      entityId: (data as { id: string }).id,
      entityType: "rooms",
    });
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/admin/schedules");
  redirectToRooms(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật phòng học." : "Đã tạo phòng học mới.",
  );
}

export async function toggleRoomStatusFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getSafeReturnPath(formData, "/admin/rooms", "/admin/rooms");
  const roomId = getStringField(formData, "room_id");
  const nextStatus = getStringField(formData, "next_status");

  if (!roomId || !nextStatus) {
    redirectToRooms(returnPath, "error", "Thiếu dữ liệu để cập nhật trạng thái phòng học.");
  }

  const supabase = createAdminClient();
  const isActive = nextStatus === "ACTIVE";
  const { error } = await supabase
    .from("rooms")
    .update({ is_active: isActive } as never)
    .eq("id", roomId);

  if (error) {
    redirectToRooms(
      returnPath,
      "error",
      parseSupabaseError(error, "Không thể cập nhật trạng thái phòng học."),
    );
  }

  await createAuditLog({
    action: isActive ? "ROOM_ACTIVATED" : "ROOM_DEACTIVATED",
    entityId: roomId,
    entityType: "rooms",
    metadata: {
      status: nextStatus,
    },
  });

  revalidatePath("/admin/rooms");
  revalidatePath("/admin/schedules");
  redirectToRooms(
    returnPath,
    "success",
    isActive ? "Đã kích hoạt phòng học." : "Đã tạm ngưng phòng học.",
  );
}
