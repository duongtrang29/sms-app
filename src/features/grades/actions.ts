"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import {
  requireLecturerEnrollmentAccess,
  requireLecturerOfferingAccess,
} from "@/lib/auth/guards";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function parseOptionalScore(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return Number(value);
}

function redirectToGradebook(
  offeringId: string,
  type: "error" | "success",
  message: string,
) {
  const searchParams = new URLSearchParams({
    [type]: message,
  });
  redirect(`/lecturer/offerings/${offeringId}?${searchParams.toString()}`);
}

export async function saveGradeFormAction(formData: FormData) {
  const profile = await requireRole(["LECTURER"]);
  const supabase = await createClient();

  const enrollmentId = formData.get("enrollment_id");
  const offeringId = formData.get("offering_id");

  if (typeof enrollmentId !== "string" || typeof offeringId !== "string") {
    redirect(`/lecturer/offerings`);
  }

  await requireLecturerEnrollmentAccess(enrollmentId, offeringId);

  const payload = {
    attendance_score: parseOptionalScore(formData.get("attendance_score")),
    enrollment_id: enrollmentId,
    final_score: parseOptionalScore(formData.get("final_score")),
    midterm_score: parseOptionalScore(formData.get("midterm_score")),
    remark:
      typeof formData.get("remark") === "string" ? formData.get("remark") : null,
    status:
      formData.get("status") === "SUBMITTED"
        ? "SUBMITTED"
        : "DRAFT",
  };

  const { data: existing, error: existingError } = await supabase
    .from("grades")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  if (existingError) {
    redirectToGradebook(offeringId, "error", existingError.message);
  }

  const existingGrade = existing as { id: string } | null;

  if (existingGrade) {
    const { error } = await supabase
      .from("grades")
      .update(payload as never)
      .eq("id", existingGrade.id);

    if (error) {
      redirectToGradebook(offeringId, "error", error.message);
    }
  } else {
    const { error } = await supabase.from("grades").insert(payload as never);

    if (error) {
      redirectToGradebook(offeringId, "error", error.message);
    }
  }

  await createAuditLog({
    action: "GRADE_SAVED",
    entityId: enrollmentId,
    entityType: "grades",
    targetUserId: profile.id,
  });

  revalidatePath(`/lecturer/offerings/${offeringId}`);
  redirectToGradebook(offeringId, "success", "Đã lưu điểm thành phần.");
}

export async function submitOfferingGradesFormAction(formData: FormData) {
  await requireRole(["LECTURER"]);
  const supabase = await createClient();
  const offeringId = formData.get("offering_id");

  if (typeof offeringId !== "string") {
    redirect("/lecturer/offerings");
  }

  await requireLecturerOfferingAccess(offeringId);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_offering_id", offeringId)
    .neq("status", "DROPPED");

  const enrollmentIds = ((enrollments as Array<{ id: string }>) ?? []).map(
    (item) => item.id,
  );

  if (enrollmentIds.length) {
    const { error } = await supabase
      .from("grades")
      .update({ status: "SUBMITTED" } as never)
      .in("enrollment_id", enrollmentIds as never);

    if (error) {
      redirectToGradebook(offeringId, "error", error.message);
    }
  }

  await createAuditLog({
    action: "GRADE_SHEET_SUBMITTED",
    entityId: offeringId,
    entityType: "course_offerings",
  });

  revalidatePath(`/lecturer/offerings/${offeringId}`);
  redirectToGradebook(offeringId, "success", "Đã gửi duyệt toàn bộ bảng điểm.");
}
