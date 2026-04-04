"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { GradeStatus } from "@/types/app";

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
  const url = new URL(`http://local${returnPath}`);
  url.searchParams.set(type, message);
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
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

  const supabase = await createClient();
  const { data: grade, error: gradeError } = await supabase
    .from("grades")
    .select("id, enrollment_id, status")
    .eq("id", gradeId)
    .maybeSingle();

  if (gradeError) {
    redirectToAdminGrades(returnPath, "error", gradeError.message);
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
    redirectToAdminGrades(returnPath, "error", enrollmentError.message);
  }

  const { error: updateError } = await supabase
    .from("grades")
    .update({ status: nextStatus } as never)
    .eq("id", gradeId);

  if (updateError) {
    redirectToAdminGrades(returnPath, "error", updateError.message);
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

  redirectToAdminGrades(returnPath, "success", "Cập nhật trạng thái điểm thành công.");
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

  const supabase = await createClient();
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_offering_id", offeringId)
    .neq("status", "DROPPED");

  if (enrollmentsError) {
    redirectToAdminGrades(returnPath, "error", enrollmentsError.message);
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
    redirectToAdminGrades(returnPath, "error", updateError.message);
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
  redirectToAdminGrades(returnPath, "success", "Xử lý batch điểm thành công.");
}
