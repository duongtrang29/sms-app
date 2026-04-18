"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildPathWithUpdates, getStringField } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

type EnrollmentActionResult<T = void> =
  | { data?: T; message?: string; success: true }
  | { error: string; success: false };

async function requireActiveStudent(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<EnrollmentActionResult<{ userId: string }>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message, success: false };
  }

  if (!user) {
    return { error: "Phiên đăng nhập đã hết hạn.", success: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_code, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message, success: false };
  }

  const resolvedProfile = profile as
    | { role_code: string; status: string }
    | null;

  if (!resolvedProfile || resolvedProfile.role_code !== "STUDENT") {
    return {
      error: "Bạn không có quyền thực hiện thao tác này.",
      success: false,
    };
  }

  if (resolvedProfile.status !== "ACTIVE") {
    return {
      error: "Tài khoản không còn hiệu lực truy cập.",
      success: false,
    };
  }

  return { data: { userId: user.id }, success: true };
}

function resolveEnrollmentReturnPath(formData: FormData) {
  const returnTo = getStringField(formData, "return_to");
  const isAllowed =
    returnTo &&
    (returnTo.startsWith("/student/enrollments") ||
      returnTo.startsWith("/student/enrollment"));

  return isAllowed ? returnTo : "/student/enrollments";
}

function redirectToEnrollmentPage(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function registerEnrollmentAction(
  formData: FormData,
): Promise<EnrollmentActionResult<{ offeringId: string }>> {
  try {
    const offeringId = formData.get("offering_id");

    if (typeof offeringId !== "string" || !offeringId) {
      return { error: "Thiếu học phần cần đăng ký.", success: false };
    }

    const supabase = await createClient();
    const context = await requireActiveStudent(supabase);

    if (!context.success) {
      return context;
    }
    if (!context.data) {
      return { error: "Không thể xác định sinh viên hiện tại.", success: false };
    }

    const rpc = supabase.rpc as unknown as (
      fn: "register_enrollment",
      payload: { p_offering_id: string },
    ) => Promise<{ error: { message: string } | null }>;
    const result = await rpc("register_enrollment", {
      p_offering_id: offeringId,
    });

    if (result.error) {
      return { error: result.error.message, success: false };
    }

    await createAuditLog({
      action: "ENROLLMENT_REGISTER_TRIGGERED",
      entityId: offeringId,
      entityType: "course_offerings",
      targetUserId: context.data.userId,
    });

    revalidatePath("/student/enrollments");
    revalidatePath("/student/enrollment");
    revalidatePath("/student/schedule");

    return {
      data: { offeringId },
      message: "Đăng ký học phần thành công.",
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return { error: message, success: false };
  }
}

export async function registerEnrollmentFormAction(formData: FormData) {
  const returnPath = resolveEnrollmentReturnPath(formData);
  const result = await registerEnrollmentAction(formData);

  if (!result.success) {
    redirectToEnrollmentPage(returnPath, "error", result.error);
  }

  redirectToEnrollmentPage(
    returnPath,
    "success",
    result.message ?? "Đăng ký thành công.",
  );
}

export async function cancelEnrollmentAction(
  formData: FormData,
): Promise<EnrollmentActionResult<{ enrollmentId: string }>> {
  try {
    const enrollmentId = formData.get("enrollment_id");

    if (typeof enrollmentId !== "string" || !enrollmentId) {
      return { error: "Thiếu enrollment cần hủy.", success: false };
    }

    const supabase = await createClient();
    const context = await requireActiveStudent(supabase);

    if (!context.success) {
      return context;
    }
    if (!context.data) {
      return { error: "Không thể xác định sinh viên hiện tại.", success: false };
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id, student_id")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollmentError) {
      return { error: enrollmentError.message, success: false };
    }

    const resolvedEnrollment = enrollment as
      | { id: string; student_id: string }
      | null;

    if (!resolvedEnrollment) {
      return { error: "Không tìm thấy enrollment.", success: false };
    }

    if (resolvedEnrollment.student_id !== context.data.userId) {
      return {
        error: "Bạn không có quyền thao tác enrollment này.",
        success: false,
      };
    }

    const rpc = supabase.rpc as unknown as (
      fn: "cancel_enrollment",
      payload: { p_enrollment_id: string; p_reason: string | null },
    ) => Promise<{ error: { message: string } | null }>;
    const result = await rpc("cancel_enrollment", {
      p_enrollment_id: enrollmentId,
      p_reason: null,
    });

    if (result.error) {
      return { error: result.error.message, success: false };
    }

    await createAuditLog({
      action: "ENROLLMENT_CANCEL_TRIGGERED",
      entityId: enrollmentId,
      entityType: "enrollments",
      targetUserId: context.data.userId,
    });

    revalidatePath("/student/enrollments");
    revalidatePath("/student/enrollment");
    revalidatePath("/student/schedule");

    return {
      data: { enrollmentId },
      message: "Hủy đăng ký học phần thành công.",
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return { error: message, success: false };
  }
}

export async function cancelEnrollmentFormAction(formData: FormData) {
  const returnPath = resolveEnrollmentReturnPath(formData);
  const result = await cancelEnrollmentAction(formData);

  if (!result.success) {
    redirectToEnrollmentPage(returnPath, "error", result.error);
  }

  redirectToEnrollmentPage(
    returnPath,
    "success",
    result.message ?? "Hủy đăng ký thành công.",
  );
}
