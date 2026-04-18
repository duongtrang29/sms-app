"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildPathWithUpdates, getStringField } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { parseSupabaseError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { RegradeStatus } from "@/types/app";
import { isValidRegradeTransition } from "@/features/regrades/transitions";

type RegradeActionResult<T = void> =
  | { data?: T; message?: string; success: true }
  | { error: string; success: false };

type SupportedRole = "ADMIN" | "LECTURER" | "STUDENT";

const allowedRegradeStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
  "CANCELLED",
] as const;

function resolveRegradeReturnPath(
  requestedPath: string | null,
  fallbackPath: string,
  allowedPrefixes: string[],
) {
  if (!requestedPath) {
    return fallbackPath;
  }

  const isAllowed = allowedPrefixes.some((prefix) =>
    requestedPath.startsWith(prefix),
  );

  return isAllowed ? requestedPath : fallbackPath;
}

function redirectToRegradePage(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

function isSupportedRole(value: string): value is SupportedRole {
  return value === "ADMIN" || value === "LECTURER" || value === "STUDENT";
}

function isAllowedRegradeStatus(
  value: string,
): value is (typeof allowedRegradeStatuses)[number] {
  return allowedRegradeStatuses.includes(
    value as (typeof allowedRegradeStatuses)[number],
  );
}

function parseResolvedScore(rawValue: FormDataEntryValue | null) {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    return { value: null };
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return { error: "Điểm sau phúc khảo phải là số hợp lệ.", value: null };
  }

  if (parsed < 0 || parsed > 10) {
    return {
      error: "Điểm sau phúc khảo phải nằm trong khoảng 0 đến 10.",
      value: null,
    };
  }

  return { value: parsed };
}

async function requireActiveProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  allowedRoles: SupportedRole[],
): Promise<RegradeActionResult<{ roleCode: SupportedRole; userId: string }>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      error: parseSupabaseError(userError, "Không thể xác thực phiên đăng nhập."),
      success: false,
    };
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
    return {
      error: parseSupabaseError(profileError, "Không thể tải thông tin người dùng."),
      success: false,
    };
  }

  const typedProfile = profile as
    | { role_code: string; status: string }
    | null;

  if (!typedProfile || !isSupportedRole(typedProfile.role_code)) {
    return { error: "Không thể xác định vai trò tài khoản.", success: false };
  }

  if (!allowedRoles.includes(typedProfile.role_code)) {
    return { error: "Bạn không có quyền thực hiện thao tác này.", success: false };
  }

  if (typedProfile.status !== "ACTIVE") {
    return { error: "Tài khoản không còn hiệu lực truy cập.", success: false };
  }

  return {
    data: { roleCode: typedProfile.role_code, userId: user.id },
    success: true,
  };
}

async function ensureLecturerCanReviewRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestId: string,
  lecturerId: string,
): Promise<RegradeActionResult> {
  const { data: request, error: requestError } = await supabase
    .from("regrade_requests")
    .select("enrollment_id")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    return {
      error: parseSupabaseError(requestError, "Không thể tải yêu cầu phúc khảo."),
      success: false,
    };
  }

  const typedRequest = request as { enrollment_id: string } | null;
  if (!typedRequest) {
    return { error: "Không tìm thấy yêu cầu phúc khảo.", success: false };
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_offering_id")
    .eq("id", typedRequest.enrollment_id)
    .maybeSingle();

  if (enrollmentError) {
    return {
      error: parseSupabaseError(enrollmentError, "Không thể tải enrollment liên quan."),
      success: false,
    };
  }

  const typedEnrollment = enrollment as { course_offering_id: string } | null;
  if (!typedEnrollment) {
    return { error: "Không tìm thấy dữ liệu enrollment liên quan.", success: false };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("teaching_assignments")
    .select("id")
    .eq("course_offering_id", typedEnrollment.course_offering_id)
    .eq("lecturer_id", lecturerId)
    .maybeSingle();

  if (assignmentError) {
    return {
      error: parseSupabaseError(
        assignmentError,
        "Không thể kiểm tra phân công giảng dạy.",
      ),
      success: false,
    };
  }

  if (!assignment) {
    return { error: "Bạn không có quyền xử lý phúc khảo của học phần này.", success: false };
  }

  return { success: true };
}

export async function createRegradeRequestAction(
  formData: FormData,
): Promise<RegradeActionResult> {
  try {
    const gradeId = formData.get("grade_id");
    const enrollmentId = formData.get("enrollment_id");
    const reason = formData.get("reason");

    if (
      typeof gradeId !== "string" ||
      typeof enrollmentId !== "string" ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return { error: "Thiếu dữ liệu để gửi yêu cầu phúc khảo.", success: false };
    }

    const supabase = await createClient();
    const context = await requireActiveProfile(supabase, ["STUDENT"]);
    if (!context.success) {
      return context;
    }
    if (!context.data) {
      return { error: "Không thể xác định sinh viên hiện tại.", success: false };
    }

    const { data: grade, error: gradeError } = await supabase
      .from("grades")
      .select("enrollment_id, total_score")
      .eq("id", gradeId)
      .maybeSingle();

    if (gradeError) {
      return {
        error: parseSupabaseError(gradeError, "Không thể tải bản ghi điểm."),
        success: false,
      };
    }

    const typedGrade = grade as
      | { enrollment_id: string; total_score: number | null }
      | null;
    if (!typedGrade) {
      return { error: "Không tìm thấy bản ghi điểm cần phúc khảo.", success: false };
    }

    if (typedGrade.enrollment_id !== enrollmentId) {
      return {
        error: "Thông tin điểm và enrollment không khớp.",
        success: false,
      };
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollmentError) {
      return {
        error: parseSupabaseError(enrollmentError, "Không thể tải enrollment."),
        success: false,
      };
    }

    const typedEnrollment = enrollment as { student_id: string } | null;
    if (!typedEnrollment || typedEnrollment.student_id !== context.data.userId) {
      return {
        error: "Bạn không có quyền gửi phúc khảo cho bản ghi này.",
        success: false,
      };
    }

    const { error: insertError } = await supabase.from("regrade_requests").insert({
      enrollment_id: enrollmentId,
      grade_id: gradeId,
      previous_total_score: typedGrade.total_score,
      reason: reason.trim(),
      student_id: context.data.userId,
    } as never);

    if (insertError) {
      return {
        error: parseSupabaseError(insertError, "Không thể gửi yêu cầu phúc khảo."),
        success: false,
      };
    }

    await createAuditLog({
      action: "REGRADE_REQUEST_CREATED",
      entityId: gradeId,
      entityType: "regrade_requests",
      targetUserId: context.data.userId,
    });

    revalidatePath("/student/regrade-requests");
    revalidatePath("/lecturer/regrade-requests");
    revalidatePath("/admin/regrade-requests");

    return { message: "Đã gửi yêu cầu phúc khảo.", success: true };
  } catch (error) {
    return {
      error: parseSupabaseError(error, "Không thể gửi yêu cầu phúc khảo."),
      success: false,
    };
  }
}

export async function createRegradeRequestFormAction(formData: FormData) {
  const returnPath = resolveRegradeReturnPath(
    getStringField(formData, "return_to"),
    "/student/regrade-requests",
    ["/student/regrade-requests"],
  );
  const result = await createRegradeRequestAction(formData);

  if (!result.success) {
    redirectToRegradePage(returnPath, "error", result.error);
  }

  redirectToRegradePage(
    returnPath,
    "success",
    result.message ?? "Đã gửi yêu cầu phúc khảo.",
  );
}

export async function resolveRegradeRequestAction(
  formData: FormData,
): Promise<RegradeActionResult<{ roleCode: SupportedRole }>> {
  try {
    const requestId = formData.get("request_id");
    const status = formData.get("status");
    const resolutionNote = formData.get("resolution_note");
    const resolvedScoreResult = parseResolvedScore(
      formData.get("resolved_total_score"),
    );

    if (
      typeof requestId !== "string" ||
      typeof status !== "string" ||
      typeof resolutionNote !== "string"
    ) {
      return { error: "Thiếu dữ liệu để xử lý phúc khảo.", success: false };
    }

    if (!isAllowedRegradeStatus(status)) {
      return { error: "Trạng thái phúc khảo không hợp lệ.", success: false };
    }

    if (resolvedScoreResult.error) {
      return { error: resolvedScoreResult.error, success: false };
    }

    const supabase = await createClient();
    const context = await requireActiveProfile(supabase, ["ADMIN", "LECTURER"]);
    if (!context.success) {
      return context;
    }
    if (!context.data) {
      return { error: "Không thể xác định người xử lý phúc khảo.", success: false };
    }

    if (context.data.roleCode === "LECTURER") {
      const access = await ensureLecturerCanReviewRequest(
        supabase,
        requestId,
        context.data.userId,
      );
      if (!access.success) {
        return access;
      }
    }

    const { data: existingRequest, error: requestError } = await supabase
      .from("regrade_requests")
      .select("status")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError) {
      return {
        error: parseSupabaseError(requestError, "Không thể tải yêu cầu phúc khảo."),
        success: false,
      };
    }

    const typedRequest = existingRequest as { status: RegradeStatus } | null;

    if (!typedRequest) {
      return { error: "Không tìm thấy yêu cầu phúc khảo.", success: false };
    }

    if (!isValidRegradeTransition(typedRequest.status, status)) {
      return {
        error: `Không thể chuyển trạng thái từ ${typedRequest.status} sang ${status}.`,
        success: false,
      };
    }

    if (status === "RESOLVED" && resolvedScoreResult.value === null) {
      return {
        error: "Trạng thái RESOLVED bắt buộc có điểm sau phúc khảo.",
        success: false,
      };
    }

    const trimmedResolutionNote = resolutionNote.trim();
    if (status === "RESOLVED" && !trimmedResolutionNote) {
      return {
        error: "Trạng thái RESOLVED bắt buộc có ghi chú xử lý.",
        success: false,
      };
    }

    const { error: updateError } = await supabase
      .from("regrade_requests")
      .update({
        resolution_note: trimmedResolutionNote || null,
        resolved_total_score: status === "RESOLVED" ? resolvedScoreResult.value : null,
        status,
      } as never)
      .eq("id", requestId);

    if (updateError) {
      return {
        error: parseSupabaseError(updateError, "Không thể cập nhật kết quả phúc khảo."),
        success: false,
      };
    }

    await createAuditLog({
      action: "REGRADE_REQUEST_RESOLVED",
      entityId: requestId,
      entityType: "regrade_requests",
      metadata: {
        previous_status: typedRequest.status,
        resolved_total_score: status === "RESOLVED" ? resolvedScoreResult.value : null,
        reviewed_by: context.data.userId,
        status,
      },
      targetUserId: context.data.userId,
    });

    revalidatePath("/admin/regrade-requests");
    revalidatePath("/lecturer/regrade-requests");
    revalidatePath("/student/regrade-requests");

    return {
      data: { roleCode: context.data.roleCode },
      message: "Cập nhật yêu cầu phúc khảo thành công.",
      success: true,
    };
  } catch (error) {
    return {
      error: parseSupabaseError(error, "Không thể xử lý yêu cầu phúc khảo."),
      success: false,
    };
  }
}

export async function resolveRegradeRequestFormAction(formData: FormData) {
  const requestedPath = getStringField(formData, "return_to");
  const result = await resolveRegradeRequestAction(formData);
  const fallbackPath =
    result.success && result.data?.roleCode === "LECTURER"
      ? "/lecturer/regrade-requests"
      : "/admin/regrade-requests";
  const returnPath = resolveRegradeReturnPath(requestedPath, fallbackPath, [
    "/admin/regrade-requests",
    "/lecturer/regrade-requests",
  ]);

  if (!result.success) {
    redirectToRegradePage(returnPath, "error", result.error);
  }

  redirectToRegradePage(
    returnPath,
    "success",
    result.message ?? "Đã cập nhật yêu cầu phúc khảo.",
  );
}
