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
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createClient } from "@/lib/supabase/server";
import { majorSchema } from "@/features/majors/schemas";
import type { ActionState } from "@/types/app";

function redirectToMajors(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertMajorAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getSafeReturnPath(formData, "/admin/majors", "/admin/majors");

  const parsed = parseWithSchema(majorSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin ngành chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const payload = {
    code: parsed.data.code.toUpperCase(),
    degree_level: parsed.data.degree_level,
    department_id: parsed.data.department_id,
    is_active: parsed.data.status === "ACTIVE",
    name: parsed.data.name,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("majors")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã ngành đã tồn tại.",
          test: ["majors_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ?? "Không thể cập nhật ngành.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "MAJOR_UPDATED",
      entityId: parsed.data.id,
      entityType: "majors",
      metadata: payload,
    });
  } else {
    const { data, error } = await supabase
      .from("majors")
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã ngành đã tồn tại.",
          test: ["majors_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ?? "Không thể tạo ngành.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "MAJOR_CREATED",
      entityId: (data as { id: string }).id,
      entityType: "majors",
      metadata: payload,
    });
  }

  revalidatePath("/admin/majors");
  redirectToMajors(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật ngành." : "Đã tạo ngành mới.",
  );
}

export async function toggleMajorStatusFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getSafeReturnPath(formData, "/admin/majors", "/admin/majors");
  const majorId = getStringField(formData, "major_id");
  const nextStatus = getStringField(formData, "next_status");

  if (!majorId || !nextStatus) {
    redirectToMajors(returnPath, "error", "Thiếu dữ liệu để cập nhật trạng thái ngành.");
  }

  const supabase = await createClient();
  const isActive = nextStatus === "ACTIVE";
  const { error } = await supabase
    .from("majors")
    .update({ is_active: isActive } as never)
    .eq("id", majorId);

  if (error) {
    redirectToMajors(returnPath, "error", error.message);
  }

  await createAuditLog({
    action: isActive ? "MAJOR_ACTIVATED" : "MAJOR_DEACTIVATED",
    entityId: majorId,
    entityType: "majors",
    metadata: {
      status: nextStatus,
    },
  });

  revalidatePath("/admin/majors");
  redirectToMajors(
    returnPath,
    "success",
    isActive ? "Đã kích hoạt ngành." : "Đã tạm ngưng ngành.",
  );
}
