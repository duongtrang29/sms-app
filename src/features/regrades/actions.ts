"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/lib/audit";
import {
  requireRegradeReviewAccess,
  requireStudentGradeOwnership,
} from "@/lib/auth/guards";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function createRegradeRequestFormAction(formData: FormData) {
  const profile = await requireRole(["STUDENT"]);
  const gradeId = formData.get("grade_id");
  const enrollmentId = formData.get("enrollment_id");
  const reason = formData.get("reason");

  if (
    typeof gradeId !== "string" ||
    typeof enrollmentId !== "string" ||
    typeof reason !== "string"
  ) {
    return;
  }

  await requireStudentGradeOwnership(gradeId, enrollmentId);

  const supabase = await createClient();
  const { data: grade, error: gradeError } = await supabase
    .from("grades")
    .select("total_score")
    .eq("id", gradeId)
    .maybeSingle();

  if (gradeError) {
    throw new Error(gradeError.message);
  }

  const { error: insertError } = await supabase.from("regrade_requests").insert({
    enrollment_id: enrollmentId,
    grade_id: gradeId,
    previous_total_score:
      (grade as { total_score: number | null } | null)?.total_score ?? null,
    reason,
    student_id: profile.id,
  } as never);

  if (insertError) {
    throw new Error(insertError.message);
  }

  await createAuditLog({
    action: "REGRADE_REQUEST_CREATED",
    entityId: gradeId,
    entityType: "regrade_requests",
    targetUserId: profile.id,
  });

  revalidatePath("/student/regrade-requests");
}

export async function resolveRegradeRequestFormAction(formData: FormData) {
  const profile = await requireRole(["ADMIN", "LECTURER"]);
  const requestId = formData.get("request_id");
  const status = formData.get("status");
  const resolutionNote = formData.get("resolution_note");
  const resolvedTotalScore = formData.get("resolved_total_score");

  if (
    typeof requestId !== "string" ||
    typeof status !== "string" ||
    typeof resolutionNote !== "string"
  ) {
    return;
  }

  await requireRegradeReviewAccess(requestId);

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("regrade_requests")
    .update({
      resolution_note: resolutionNote,
      resolved_total_score:
        typeof resolvedTotalScore === "string" && resolvedTotalScore
          ? Number(resolvedTotalScore)
          : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
      status,
    } as never)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await createAuditLog({
    action: "REGRADE_REQUEST_RESOLVED",
    entityId: requestId,
    entityType: "regrade_requests",
    metadata: {
      reviewed_by: profile.id,
      status,
    },
    targetUserId: profile.id,
  });

  revalidatePath("/admin/regrade-requests");
  revalidatePath("/lecturer/regrade-requests");
  revalidatePath("/student/regrade-requests");
}
