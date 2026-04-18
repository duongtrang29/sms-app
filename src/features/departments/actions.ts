"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import { buildPathWithUpdates } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { parseSupabaseError } from "@/lib/errors";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { departmentSchema } from "@/features/departments/schemas";
import type { ActionState } from "@/types/app";

function getStringField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : null;
}

function getReturnPath(formData: FormData) {
  const returnTo = getStringField(formData, "return_to");
  return returnTo && returnTo.startsWith("/admin/departments")
    ? returnTo
    : "/admin/departments";
}

function redirectToDepartments(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertDepartmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const parsed = parseWithSchema(departmentSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin khoa chưa hợp lệ.", parsed.errors);
  }

  const supabase = createAdminClient();
  const payload = {
    code: parsed.data.code.toUpperCase(),
    description: parsed.data.description || null,
    is_active: parsed.data.status === "ACTIVE",
    name: parsed.data.name,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("departments")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã khoa đã tồn tại.",
          test: ["departments_code_key", "duplicate key"],
        },
      ]);

      return failure(
        fieldErrors?.code?.[0] ??
          parseSupabaseError(error, "Không thể cập nhật khoa."),
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "DEPARTMENT_UPDATED",
      entityId: parsed.data.id,
      entityType: "departments",
      metadata: payload,
    });

    revalidatePath("/admin/departments");
    redirectToDepartments(returnPath, "success", "Đã cập nhật khoa.");
  }

  const { data, error } = await supabase
    .from("departments")
    .insert(payload as never)
    .select("id")
    .single();

  if (error) {
    const fieldErrors = matchServerFieldErrors(error.message, [
      {
        field: "code",
        message: "Mã khoa đã tồn tại.",
        test: ["departments_code_key", "duplicate key"],
      },
    ]);

    return failure(
      fieldErrors?.code?.[0] ??
        parseSupabaseError(error, "Không thể tạo khoa mới."),
      fieldErrors,
    );
  }

  await createAuditLog({
    action: "DEPARTMENT_CREATED",
    entityId: (data as { id: string }).id,
    entityType: "departments",
    metadata: payload,
  });

  revalidatePath("/admin/departments");
  redirectToDepartments(returnPath, "success", "Đã tạo khoa mới.");
}

export async function deleteDepartmentFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getReturnPath(formData);
  const departmentId = getStringField(formData, "department_id");

  if (!departmentId) {
    redirectToDepartments(returnPath, "error", "Thiếu khoa cần xóa.");
  }

  const supabase = createAdminClient();

  const [
    { count: majorCount, error: majorError },
    { count: lecturerCount, error: lecturerError },
    { count: courseCount, error: courseError },
  ] = await Promise.all([
    supabase
      .from("majors")
      .select("id", { count: "exact", head: true })
      .eq("department_id", departmentId),
    supabase
      .from("lecturers")
      .select("id", { count: "exact", head: true })
      .eq("department_id", departmentId),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("department_id", departmentId),
  ]);

  if (majorError || lecturerError || courseError) {
    const firstError = majorError ?? lecturerError ?? courseError;
    redirectToDepartments(
      returnPath,
      "error",
      parseSupabaseError(firstError, "Không thể kiểm tra ràng buộc khoa."),
    );
  }

  if ((majorCount ?? 0) > 0) {
    redirectToDepartments(
      returnPath,
      "error",
      "Khoa đã có ngành trực thuộc, không thể xóa.",
    );
  }

  if ((lecturerCount ?? 0) > 0) {
    redirectToDepartments(
      returnPath,
      "error",
      "Khoa đã có giảng viên trực thuộc, không thể xóa.",
    );
  }

  if ((courseCount ?? 0) > 0) {
    redirectToDepartments(
      returnPath,
      "error",
      "Khoa đã có môn học liên kết, không thể xóa.",
    );
  }

  const { error: deleteError } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId);

  if (deleteError) {
    redirectToDepartments(
      returnPath,
      "error",
      parseSupabaseError(deleteError, "Không thể xóa khoa."),
    );
  }

  await createAuditLog({
    action: "DEPARTMENT_DELETED",
    entityId: departmentId,
    entityType: "departments",
  });

  revalidatePath("/admin/departments");
  redirectToDepartments(returnPath, "success", "Đã xóa khoa.");
}
