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
import { academicClassSchema } from "@/features/academic-classes/schemas";
import type { ActionState } from "@/types/app";

function redirectToAcademicClasses(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertAcademicClassAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getSafeReturnPath(formData, "/admin/classes", "/admin/classes");

  const parsed = parseWithSchema(academicClassSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin lớp sinh hoạt chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const payload = {
    code: parsed.data.code.toUpperCase(),
    cohort_year: parsed.data.cohort_year,
    is_active: parsed.data.status === "ACTIVE",
    major_id: parsed.data.major_id,
    name: parsed.data.name,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("academic_classes")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã lớp đã tồn tại.",
          test: ["academic_classes_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ?? "Không thể cập nhật lớp sinh hoạt.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "ACADEMIC_CLASS_UPDATED",
      entityId: parsed.data.id,
      entityType: "academic_classes",
      metadata: payload,
    });
  } else {
    const { data, error } = await supabase
      .from("academic_classes")
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã lớp đã tồn tại.",
          test: ["academic_classes_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ?? "Không thể tạo lớp sinh hoạt.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "ACADEMIC_CLASS_CREATED",
      entityId: (data as { id: string }).id,
      entityType: "academic_classes",
      metadata: payload,
    });
  }

  revalidatePath("/admin/classes");
  redirectToAcademicClasses(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật lớp sinh hoạt." : "Đã tạo lớp sinh hoạt mới.",
  );
}

export async function toggleAcademicClassStatusFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getSafeReturnPath(formData, "/admin/classes", "/admin/classes");
  const academicClassId = getStringField(formData, "academic_class_id");
  const nextStatus = getStringField(formData, "next_status");

  if (!academicClassId || !nextStatus) {
    redirectToAcademicClasses(
      returnPath,
      "error",
      "Thiếu dữ liệu để cập nhật trạng thái lớp sinh hoạt.",
    );
  }

  const supabase = await createClient();
  const isActive = nextStatus === "ACTIVE";
  const { error } = await supabase
    .from("academic_classes")
    .update({ is_active: isActive } as never)
    .eq("id", academicClassId);

  if (error) {
    redirectToAcademicClasses(returnPath, "error", error.message);
  }

  await createAuditLog({
    action: isActive
      ? "ACADEMIC_CLASS_ACTIVATED"
      : "ACADEMIC_CLASS_DEACTIVATED",
    entityId: academicClassId,
    entityType: "academic_classes",
    metadata: {
      status: nextStatus,
    },
  });

  revalidatePath("/admin/classes");
  redirectToAcademicClasses(
    returnPath,
    "success",
    isActive ? "Đã kích hoạt lớp sinh hoạt." : "Đã tạm ngưng lớp sinh hoạt.",
  );
}
