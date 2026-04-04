"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure } from "@/lib/actions";
import { requireStudentEnrollmentOwnership } from "@/lib/auth/guards";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/app";

function redirectToEnrollmentPage(
  type: "error" | "success",
  message: string,
) {
  const searchParams = new URLSearchParams({
    [type]: message,
  });

  redirect(`/student/enrollments?${searchParams.toString()}`);
}

export async function registerEnrollmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["STUDENT"]);
  const offeringId = formData.get("offering_id");

  if (typeof offeringId !== "string") {
    return failure("Thiếu học phần cần đăng ký.");
  }

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: "register_enrollment",
    payload: { p_offering_id: string },
  ) => Promise<{ error: { message: string } | null }>;
  const result = await rpc("register_enrollment", {
    p_offering_id: offeringId,
  });

  if (result.error) {
    return failure(result.error.message);
  }

  await createAuditLog({
    action: "ENROLLMENT_REGISTER_TRIGGERED",
    entityId: offeringId,
    entityType: "course_offerings",
  });

  revalidatePath("/student/enrollments");
  redirect("/student/enrollments");
}

export async function registerEnrollmentFormAction(formData: FormData) {
  const result = await registerEnrollmentAction({ success: false }, formData);

  if (!result.success && result.message) {
    redirectToEnrollmentPage("error", result.message);
  }
}

export async function cancelEnrollmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["STUDENT"]);
  const enrollmentId = formData.get("enrollment_id");

  if (typeof enrollmentId !== "string") {
    return failure("Thiếu enrollment cần hủy.");
  }

  try {
    await requireStudentEnrollmentOwnership(enrollmentId);
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Không thể xác minh enrollment.",
    );
  }

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: "cancel_enrollment",
    payload: { p_enrollment_id: string; p_reason: string | null },
  ) => Promise<{ error: { message: string } | null }>;
  const result = await rpc("cancel_enrollment", {
    p_enrollment_id: enrollmentId,
    p_reason: null,
  });

  if (result.error) {
    return failure(result.error.message);
  }

  revalidatePath("/student/enrollments");
  redirect("/student/enrollments");
}

export async function cancelEnrollmentFormAction(formData: FormData) {
  const result = await cancelEnrollmentAction({ success: false }, formData);

  if (!result.success && result.message) {
    redirectToEnrollmentPage("error", result.message);
  }
}
