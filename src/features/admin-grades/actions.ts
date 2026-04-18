"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildPathWithUpdates } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { parseSupabaseError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GradeStatus } from "@/types/app";
import type { Json } from "@/types/database";

const gradeStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "LOCKED"] as const;

function isGradeStatus(value: string): value is GradeStatus {
  return gradeStatuses.includes(value as GradeStatus);
}

function getStringField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : null;
}

function getReturnPath(formData: FormData) {
  const returnTo = getStringField(formData, "return_to");
  return returnTo && returnTo.startsWith("/admin/grades")
    ? returnTo
    : "/admin/grades";
}

function redirectToAdminGrades(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(relation)) {
    return relation[0];
  }

  return relation ?? undefined;
}

async function getOfferingLabel(offeringId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("course_offerings")
    .select(
      `
        section_code,
        course:courses!inner(
          code,
          name
        )
      `,
    )
    .eq("id", offeringId)
    .maybeSingle();

  const typed = data as
    | {
        course:
          | { code: string | null; name: string | null }
          | Array<{ code: string | null; name: string | null }>
          | null;
        section_code: string | null;
      }
    | null;
  const course = normalizeRelation(typed?.course);

  if (!typed || !course) {
    return "học phần";
  }

  return `${course.code ?? "N/A"} - ${course.name ?? "Chưa có tên"} (Nhóm ${typed.section_code ?? "N/A"})`;
}

export async function transitionGradeStatusFormAction(formData: FormData) {
  const profile = await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const gradeId = getStringField(formData, "grade_id");
  const nextStatus = getStringField(formData, "next_status");

  if (!gradeId || !nextStatus) {
    redirectToAdminGrades(returnPath, "error", "Thiếu dữ liệu chuyển trạng thái điểm.");
  }

  if (!isGradeStatus(nextStatus)) {
    redirectToAdminGrades(returnPath, "error", "Trạng thái điểm không hợp lệ.");
  }

  const supabase = createAdminClient();
  const { data: grade, error: gradeError } = await supabase
    .from("grades")
    .select("id, enrollment_id, status")
    .eq("id", gradeId)
    .maybeSingle();

  if (gradeError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(gradeError, "Không thể tải bản ghi điểm."),
    );
  }

  if (!grade) {
    redirectToAdminGrades(returnPath, "error", "Không tìm thấy bản ghi điểm.");
  }

  const existingGrade = grade as {
    enrollment_id: string;
    status: GradeStatus;
  };

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_offering_id")
    .eq("id", existingGrade.enrollment_id)
    .maybeSingle();

  if (enrollmentError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(enrollmentError, "Không thể tải dữ liệu đăng ký học phần."),
    );
  }

  const { error: updateError } = await supabase
    .from("grades")
    .update({ status: nextStatus } as never)
    .eq("id", gradeId);

  if (updateError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(updateError, "Không thể cập nhật trạng thái điểm."),
    );
  }

  await createAuditLog({
    action: "GRADE_STATUS_CHANGED",
    entityId: gradeId,
    entityType: "grades",
    metadata: {
      changed_by: profile.id,
      next_status: nextStatus,
      previous_status: existingGrade.status,
    },
  });

  revalidatePath("/admin/grades");
  revalidatePath("/student/grades");

  const courseOfferingId = (
    enrollment as { course_offering_id: string } | null
  )?.course_offering_id;

  if (courseOfferingId) {
    revalidatePath(`/lecturer/offerings/${courseOfferingId}`);
  }
  const offeringLabel = courseOfferingId
    ? await getOfferingLabel(courseOfferingId)
    : "học phần";
  redirectToAdminGrades(
    returnPath,
    "success",
    `Cập nhật trạng thái điểm thành công cho ${offeringLabel}.`,
  );
}

export async function transitionOfferingGradesFormAction(formData: FormData) {
  const profile = await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const currentStatus = getStringField(formData, "current_status");
  const nextStatus = getStringField(formData, "next_status");
  const offeringId = getStringField(formData, "offering_id");

  if (!offeringId || !currentStatus || !nextStatus) {
    redirectToAdminGrades(returnPath, "error", "Thiếu dữ liệu xử lý batch điểm.");
  }

  if (!isGradeStatus(currentStatus) || !isGradeStatus(nextStatus)) {
    redirectToAdminGrades(returnPath, "error", "Trạng thái batch điểm không hợp lệ.");
  }

  const supabase = createAdminClient();
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_offering_id", offeringId)
    .neq("status", "DROPPED");

  if (enrollmentsError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(enrollmentsError, "Không thể tải danh sách đăng ký học phần."),
    );
  }

  const enrollmentIds = ((enrollments as Array<{ id: string }>) ?? []).map(
    (item) => item.id,
  );

  if (!enrollmentIds.length) {
    redirectToAdminGrades(returnPath, "error", "Không có enrollment phù hợp để xử lý batch.");
  }

  const { error: updateError } = await supabase
    .from("grades")
    .update({ status: nextStatus } as never)
    .eq("status", currentStatus)
    .in("enrollment_id", enrollmentIds as never);

  if (updateError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(updateError, "Không thể xử lý batch trạng thái điểm."),
    );
  }

  await createAuditLog({
    action: "GRADE_BATCH_STATUS_CHANGED",
    entityId: offeringId,
    entityType: "course_offerings",
    metadata: {
      changed_by: profile.id,
      current_status: currentStatus,
      next_status: nextStatus,
    },
  });

  revalidatePath("/admin/grades");
  revalidatePath(`/lecturer/offerings/${offeringId}`);
  revalidatePath("/student/grades");
  const offeringLabel = await getOfferingLabel(offeringId);
  redirectToAdminGrades(
    returnPath,
    "success",
    `Xử lý trạng thái điểm thành công cho ${offeringLabel}.`,
  );
}

export async function rejectOfferingGradesFormAction(formData: FormData) {
  const profile = await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");
  const reason = getStringField(formData, "reason")?.trim() ?? "";

  if (!offeringId) {
    redirectToAdminGrades(returnPath, "error", "Thiếu học phần cần trả điểm về DRAFT.");
  }

  if (reason.length < 3) {
    redirectToAdminGrades(returnPath, "error", "Lý do trả điểm phải có ít nhất 3 ký tự.");
  }

  const supabase = createAdminClient();
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_offering_id", offeringId)
    .neq("status", "DROPPED");

  if (enrollmentsError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(enrollmentsError, "Không thể tải danh sách enrollment."),
    );
  }

  const enrollmentIds = ((enrollments as Array<{ id: string }>) ?? []).map(
    (item) => item.id,
  );
  if (!enrollmentIds.length) {
    redirectToAdminGrades(returnPath, "error", "Học phần chưa có enrollment hợp lệ.");
  }

  const { data: gradeRows, error: gradeLookupError } = await supabase
    .from("grades")
    .select("id, status")
    .in("enrollment_id", enrollmentIds as never)
    .in("status", ["SUBMITTED", "APPROVED"] as never);

  if (gradeLookupError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(gradeLookupError, "Không thể tải danh sách điểm cần trả."),
    );
  }

  const targets =
    (gradeRows as Array<{ id: string; status: GradeStatus }> | null) ?? [];
  if (!targets.length) {
    redirectToAdminGrades(
      returnPath,
      "error",
      "Không có điểm ở trạng thái SUBMITTED/APPROVED để trả về DRAFT.",
    );
  }

  const targetIds = targets.map((target) => target.id);
  const { error: updateError } = await supabase
    .from("grades")
    .update({ remark: `REJECT: ${reason}`, status: "DRAFT" } as never)
    .in("id", targetIds as never);

  if (updateError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(updateError, "Không thể trả bảng điểm về DRAFT."),
    );
  }

  const logs = targets.map((target) => ({
    change_type: "ADMIN_REJECT_TO_DRAFT",
    changed_by: profile.id,
    grade_id: target.id,
    new_payload: {
      reason,
      status: "DRAFT",
    } satisfies Json,
    note: reason,
    old_payload: {
      status: target.status,
    } satisfies Json,
  }));

  const { error: logError } = await supabase
    .from("grade_change_logs")
    .insert(logs as never);

  if (logError) {
    redirectToAdminGrades(
      returnPath,
      "error",
      parseSupabaseError(logError, "Đã trả điểm về DRAFT nhưng không ghi được log lý do."),
    );
  }

  await createAuditLog({
    action: "GRADE_BATCH_REJECTED",
    entityId: offeringId,
    entityType: "course_offerings",
    metadata: {
      changed_by: profile.id,
      reason,
      target_count: targetIds.length,
    },
  });

  revalidatePath("/admin/grades");
  revalidatePath(`/lecturer/offerings/${offeringId}`);
  revalidatePath("/student/grades");
  const offeringLabel = await getOfferingLabel(offeringId);
  redirectToAdminGrades(
    returnPath,
    "success",
    `Đã trả bảng điểm về DRAFT cho ${offeringLabel}.`,
  );
}
