"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import { buildPathWithUpdates } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createClient } from "@/lib/supabase/server";
import { courseOfferingSchema } from "@/features/course-offerings/schemas";
import type { ActionState } from "@/types/app";

function getStringField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : null;
}

function getReturnPath(formData: FormData) {
  const returnTo = getStringField(formData, "return_to");
  return returnTo && returnTo.startsWith("/admin/offerings")
    ? returnTo
    : "/admin/offerings";
}

function redirectToOfferings(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertCourseOfferingAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const parsed = parseWithSchema(courseOfferingSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin học phần mở chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const rpcPayload = {
    p_attendance_weight: parsed.data.attendance_weight,
    p_course_id: parsed.data.course_id,
    p_final_weight: parsed.data.final_weight,
    p_lecturer_id: parsed.data.lecturer_id || null,
    p_max_capacity: parsed.data.max_capacity,
    p_midterm_weight: parsed.data.midterm_weight,
    p_notes: parsed.data.notes || null,
    p_offering_id: parsed.data.id ?? null,
    p_passing_score: parsed.data.passing_score,
    p_registration_close_at: parsed.data.registration_close_at,
    p_registration_open_at: parsed.data.registration_open_at,
    p_section_code: parsed.data.section_code.toUpperCase(),
    p_semester_id: parsed.data.semester_id,
    p_status: parsed.data.status,
    p_title: parsed.data.title || null,
  };

  const rpc = supabase.rpc as unknown as (
    fn: "upsert_course_offering_with_assignment",
    payload: typeof rpcPayload,
  ) => Promise<{ data: string | null; error: { message: string } | null }>;

  const { data: offeringId, error: rpcError } = await rpc(
    "upsert_course_offering_with_assignment",
    rpcPayload,
  );

  if (rpcError) {
    const fieldErrors = matchServerFieldErrors(rpcError.message, [
      {
        field: "section_code",
        message: "Nhóm học phần đã tồn tại trong học kỳ của môn học này.",
        test: "course_offerings_unique_section",
      },
      {
        field: "lecturer_id",
        message: "Không thể gán giảng viên cho học phần.",
        test: ["teaching_assignments", "lecturer"],
      },
    ]);

    return failure(
      fieldErrors?.section_code?.[0] ??
        fieldErrors?.lecturer_id?.[0] ??
        (parsed.data.id
          ? "Không thể cập nhật học phần mở."
          : "Không thể tạo học phần mở."),
      fieldErrors,
    );
  }

  if (!offeringId) {
    return failure("Không xác định được học phần mở.");
  }

  await createAuditLog({
    action: parsed.data.id
      ? "COURSE_OFFERING_UPDATED"
      : "COURSE_OFFERING_CREATED",
    entityId: offeringId,
    entityType: "course_offerings",
  });

  revalidatePath("/admin/offerings");
  revalidatePath("/admin/schedules");
  redirectToOfferings(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật học phần mở." : "Đã mở học phần mới.",
  );
}

export async function deleteCourseOfferingFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");

  if (!offeringId) {
    redirectToOfferings(returnPath, "error", "Thiếu học phần mở cần xóa.");
  }

  const supabase = await createClient();
  const { count: enrollmentCount, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_offering_id", offeringId);

  if (enrollmentError) {
    redirectToOfferings(returnPath, "error", enrollmentError.message);
  }

  if ((enrollmentCount ?? 0) > 0) {
    redirectToOfferings(
      returnPath,
      "error",
      "Học phần đã có đăng ký hoặc lịch sử học tập, không thể xóa.",
    );
  }

  const { error: deleteError } = await supabase
    .from("course_offerings")
    .delete()
    .eq("id", offeringId);

  if (deleteError) {
    redirectToOfferings(returnPath, "error", deleteError.message);
  }

  await createAuditLog({
    action: "COURSE_OFFERING_DELETED",
    entityId: offeringId,
    entityType: "course_offerings",
  });

  revalidatePath("/admin/offerings");
  revalidatePath("/admin/schedules");
  redirectToOfferings(returnPath, "success", "Đã xóa học phần mở.");
}
