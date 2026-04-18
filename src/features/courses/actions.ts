"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import { buildPathWithUpdates } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createClient } from "@/lib/supabase/server";
import { courseSchema } from "@/features/courses/schemas";
import type { ActionState } from "@/types/app";

function getStringField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : null;
}

function getReturnPath(formData: FormData) {
  const returnTo = getStringField(formData, "return_to");
  return returnTo && returnTo.startsWith("/admin/courses")
    ? returnTo
    : "/admin/courses";
}

function redirectToCourses(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertCourseAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const parsed = parseWithSchema(courseSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin môn học chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const prerequisiteCodes = (parsed.data.prerequisite_codes ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  const rpcPayload = {
    p_code: parsed.data.code.toUpperCase(),
    p_course_id: parsed.data.id ?? null,
    p_credit_hours: parsed.data.credit_hours,
    p_department_id: parsed.data.department_id,
    p_description: parsed.data.description || null,
    p_is_active: parsed.data.status === "ACTIVE",
    p_name: parsed.data.name,
    p_prerequisite_codes: prerequisiteCodes,
    p_total_sessions: parsed.data.total_sessions,
  };

  const rpc = supabase.rpc as unknown as (
    fn: "upsert_course_with_prerequisites",
    payload: typeof rpcPayload,
  ) => Promise<{ data: string | null; error: { message: string } | null }>;

  const { data: courseId, error: rpcError } = await rpc(
    "upsert_course_with_prerequisites",
    rpcPayload,
  );

  if (rpcError) {
    const fieldErrors = matchServerFieldErrors(rpcError.message, [
      {
        field: "code",
        message: "Mã môn đã tồn tại.",
        test: ["courses_code_key", "duplicate key"],
      },
      {
        field: "prerequisite_codes",
        message: rpcError.message,
        test: "Missing prerequisite course(s):",
      },
    ]);

    return failure(
      fieldErrors?.code?.[0] ??
        fieldErrors?.prerequisite_codes?.[0] ??
        (parsed.data.id
          ? "Không thể cập nhật môn học."
          : "Không thể tạo môn học."),
      fieldErrors,
    );
  }

  if (!courseId) {
    return failure("Không thể xác định môn học để lưu.");
  }

  await createAuditLog({
    action: parsed.data.id ? "COURSE_UPDATED" : "COURSE_CREATED",
    entityId: courseId,
    entityType: "courses",
  });

  revalidatePath("/admin/courses");
  revalidatePath("/admin/offerings");
  redirectToCourses(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật môn học." : "Đã tạo môn học mới.",
  );
}

export async function deleteCourseFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getReturnPath(formData);
  const courseId = getStringField(formData, "course_id");

  if (!courseId) {
    redirectToCourses(returnPath, "error", "Thiếu môn học cần xóa.");
  }

  const supabase = await createClient();

  const [
    { count: offeringCount, error: offeringError },
    { count: prerequisiteReferenceCount, error: prerequisiteReferenceError },
  ] = await Promise.all([
    supabase
      .from("course_offerings")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId),
    supabase
      .from("course_prerequisites")
      .select("course_id", { count: "exact", head: true })
      .eq("prerequisite_course_id", courseId),
  ]);

  if (offeringError || prerequisiteReferenceError) {
    redirectToCourses(
      returnPath,
      "error",
      offeringError?.message ??
        prerequisiteReferenceError?.message ??
        "Không thể kiểm tra ràng buộc môn học.",
    );
  }

  if ((offeringCount ?? 0) > 0) {
    redirectToCourses(
      returnPath,
      "error",
      "Môn học đã có học phần mở, không thể xóa.",
    );
  }

  if ((prerequisiteReferenceCount ?? 0) > 0) {
    redirectToCourses(
      returnPath,
      "error",
      "Môn học đang được dùng làm môn tiên quyết, không thể xóa.",
    );
  }

  const { error: deleteError } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (deleteError) {
    redirectToCourses(returnPath, "error", deleteError.message);
  }

  await createAuditLog({
    action: "COURSE_DELETED",
    entityId: courseId,
    entityType: "courses",
  });

  revalidatePath("/admin/courses");
  revalidatePath("/admin/offerings");
  redirectToCourses(returnPath, "success", "Đã xóa môn học.");
}
