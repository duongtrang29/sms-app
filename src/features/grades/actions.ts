"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildPathWithUpdates, getStringField } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

type GradeActionResult<T = void> =
  | { data?: T; message?: string; success: true }
  | { error: string; success: false };

type GradePayload = {
  attendance_score: number | null;
  enrollment_id: string;
  final_score: number | null;
  midterm_score: number | null;
  remark: string | null;
  status: "DRAFT" | "SUBMITTED";
};

function parseOptionalScore(
  value: FormDataEntryValue | null,
  label: string,
): { error?: string; value: number | null } {
  if (typeof value !== "string" || value.trim() === "") {
    return { value: null };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} phải là số hợp lệ.`, value: null };
  }

  if (parsed < 0 || parsed > 10) {
    return { error: `${label} phải nằm trong khoảng 0 đến 10.`, value: null };
  }

  return { value: parsed };
}

function resolveGradebookReturnPath(formData: FormData, offeringId: string) {
  const returnTo = getStringField(formData, "return_to");
  const isAllowed =
    returnTo &&
    (returnTo.startsWith("/lecturer/offerings/") ||
      returnTo.startsWith("/lecturer/grades/"));

  if (isAllowed) {
    return returnTo;
  }

  return `/lecturer/offerings/${offeringId}`;
}

async function requireActiveLecturer(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<GradeActionResult<{ userId: string }>> {
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

  const typedProfile = profile as
    | { role_code: string; status: string }
    | null;

  if (!typedProfile || typedProfile.role_code !== "LECTURER") {
    return { error: "Bạn không có quyền thực hiện thao tác này.", success: false };
  }

  if (typedProfile.status !== "ACTIVE") {
    return { error: "Tài khoản không còn hiệu lực truy cập.", success: false };
  }

  return { data: { userId: user.id }, success: true };
}

async function ensureLecturerOfferingAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lecturerId: string,
  offeringId: string,
): Promise<GradeActionResult> {
  const { data, error } = await supabase
    .from("teaching_assignments")
    .select("id")
    .eq("lecturer_id", lecturerId)
    .eq("course_offering_id", offeringId)
    .maybeSingle();

  if (error) {
    return { error: error.message, success: false };
  }

  if (!data) {
    return { error: "Bạn không được phân công học phần này.", success: false };
  }

  return { success: true };
}

async function ensureEnrollmentInOffering(
  supabase: Awaited<ReturnType<typeof createClient>>,
  enrollmentId: string,
  offeringId: string,
): Promise<GradeActionResult> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("course_offering_id, status")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) {
    return { error: error.message, success: false };
  }

  const enrollment = data as
    | { course_offering_id: string; status: string }
    | null;

  if (!enrollment) {
    return { error: "Không tìm thấy đăng ký học phần.", success: false };
  }

  if (enrollment.course_offering_id !== offeringId) {
    return {
      error: "Đăng ký học phần không thuộc lớp giảng dạy đã chọn.",
      success: false,
    };
  }

  if (enrollment.status === "DROPPED") {
    return {
      error: "Sinh viên đã hủy học phần này, không thể nhập điểm.",
      success: false,
    };
  }

  return { success: true };
}

function buildGradePayload(
  formData: FormData,
  enrollmentId: string,
): GradeActionResult<GradePayload> {
  const attendance = parseOptionalScore(formData.get("attendance_score"), "Điểm chuyên cần");
  if (attendance.error) {
    return { error: attendance.error, success: false };
  }

  const midterm = parseOptionalScore(formData.get("midterm_score"), "Điểm giữa kỳ");
  if (midterm.error) {
    return { error: midterm.error, success: false };
  }

  const finalScore = parseOptionalScore(formData.get("final_score"), "Điểm cuối kỳ");
  if (finalScore.error) {
    return { error: finalScore.error, success: false };
  }

  const remarkField = formData.get("remark");
  const remark =
    typeof remarkField === "string" && remarkField.trim()
      ? remarkField.trim()
      : null;

  return {
    data: {
      attendance_score: attendance.value,
      enrollment_id: enrollmentId,
      final_score: finalScore.value,
      midterm_score: midterm.value,
      remark,
      status: formData.get("status") === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
    },
    success: true,
  };
}

function redirectToGradebook(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function saveGradeAction(
  formData: FormData,
): Promise<GradeActionResult<{ offeringId: string }>> {
  try {
    const enrollmentId = formData.get("enrollment_id");
    const offeringId = formData.get("offering_id");

    if (typeof enrollmentId !== "string" || typeof offeringId !== "string") {
      return { error: "Thiếu dữ liệu để lưu điểm.", success: false };
    }

    const payloadResult = buildGradePayload(formData, enrollmentId);
    if (!payloadResult.success) {
      return payloadResult;
    }
    if (!payloadResult.data) {
      return { error: "Không thể tạo dữ liệu lưu điểm.", success: false };
    }

    const supabase = await createClient();
    const context = await requireActiveLecturer(supabase);
    if (!context.success) {
      return context;
    }
    if (!context.data) {
      return { error: "Không thể xác định giảng viên hiện tại.", success: false };
    }

    const offeringAccess = await ensureLecturerOfferingAccess(
      supabase,
      context.data.userId,
      offeringId,
    );
    if (!offeringAccess.success) {
      return offeringAccess;
    }

    const enrollmentAccess = await ensureEnrollmentInOffering(
      supabase,
      enrollmentId,
      offeringId,
    );
    if (!enrollmentAccess.success) {
      return enrollmentAccess;
    }

    const { data: existing, error: existingError } = await supabase
      .from("grades")
      .select("id")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();

    if (existingError) {
      return { error: existingError.message, success: false };
    }

    const existingGrade = existing as { id: string } | null;

    if (existingGrade) {
      const { error } = await supabase
        .from("grades")
        .update(payloadResult.data as never)
        .eq("id", existingGrade.id);

      if (error) {
        return { error: error.message, success: false };
      }
    } else {
      const { error } = await supabase
        .from("grades")
        .insert(payloadResult.data as never);

      if (error) {
        return { error: error.message, success: false };
      }
    }

    await createAuditLog({
      action: "GRADE_SAVED",
      entityId: enrollmentId,
      entityType: "grades",
      targetUserId: context.data.userId,
    });

    revalidatePath(`/lecturer/offerings/${offeringId}`);
    revalidatePath(`/lecturer/grades/${offeringId}`);
    revalidatePath("/admin/grades");
    revalidatePath("/student/grades");

    return {
      data: { offeringId },
      message: "Đã lưu điểm thành phần.",
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return { error: message, success: false };
  }
}

export async function saveGradeFormAction(formData: FormData) {
  const offeringId = formData.get("offering_id");
  if (typeof offeringId !== "string" || !offeringId) {
    redirect("/lecturer/offerings");
  }

  const returnPath = resolveGradebookReturnPath(formData, offeringId);
  const result = await saveGradeAction(formData);

  if (!result.success) {
    redirectToGradebook(returnPath, "error", result.error);
  }

  redirectToGradebook(returnPath, "success", result.message ?? "Lưu điểm thành công.");
}

export async function submitOfferingGradesAction(
  formData: FormData,
): Promise<GradeActionResult<{ offeringId: string }>> {
  try {
    const offeringId = formData.get("offering_id");

    if (typeof offeringId !== "string" || !offeringId) {
      return { error: "Thiếu học phần cần gửi duyệt.", success: false };
    }

    const supabase = await createClient();
    const context = await requireActiveLecturer(supabase);
    if (!context.success) {
      return context;
    }
    if (!context.data) {
      return { error: "Không thể xác định giảng viên hiện tại.", success: false };
    }

    const offeringAccess = await ensureLecturerOfferingAccess(
      supabase,
      context.data.userId,
      offeringId,
    );
    if (!offeringAccess.success) {
      return offeringAccess;
    }

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_offering_id", offeringId)
      .neq("status", "DROPPED");

    if (enrollmentsError) {
      return { error: enrollmentsError.message, success: false };
    }

    const enrollmentIds = ((enrollments as Array<{ id: string }>) ?? []).map(
      (item) => item.id,
    );

    if (!enrollmentIds.length) {
      return {
        error: "Học phần chưa có sinh viên đăng ký để gửi duyệt.",
        success: false,
      };
    }

    const { data: gradeRows, error: gradeLookupError } = await supabase
      .from("grades")
      .select(
        "id, enrollment_id, status, attendance_score, midterm_score, final_score",
      )
      .in("enrollment_id", enrollmentIds as never);

    if (gradeLookupError) {
      return { error: gradeLookupError.message, success: false };
    }

    const typedGradeRows =
      (gradeRows as Array<{
        attendance_score: number | null;
        enrollment_id: string;
        final_score: number | null;
        id: string;
        midterm_score: number | null;
        status: "APPROVED" | "DRAFT" | "LOCKED" | "SUBMITTED";
      }>) ?? [];

    const byEnrollment = new Map(
      typedGradeRows.map((row) => [row.enrollment_id, row]),
    );
    const missingGradeCount = enrollmentIds.filter(
      (enrollmentId) => !byEnrollment.has(enrollmentId),
    ).length;

    if (missingGradeCount > 0) {
      return {
        error: `Có ${missingGradeCount} sinh viên chưa có bản ghi điểm, chưa thể gửi duyệt.`,
        success: false,
      };
    }

    const invalidStatusCount = typedGradeRows.filter(
      (row) => row.status !== "DRAFT" && row.status !== "SUBMITTED",
    ).length;

    if (invalidStatusCount > 0) {
      return {
        error:
          "Có bản ghi điểm đang ở trạng thái đã duyệt/đã khóa, không thể gửi duyệt batch.",
        success: false,
      };
    }

    const incompleteScoreCount = typedGradeRows.filter(
      (row) =>
        row.status === "DRAFT" &&
        (row.attendance_score === null ||
          row.midterm_score === null ||
          row.final_score === null),
    ).length;

    if (incompleteScoreCount > 0) {
      return {
        error: `Có ${incompleteScoreCount} bản ghi điểm còn thiếu điểm thành phần, chưa thể gửi duyệt.`,
        success: false,
      };
    }

    const draftEnrollmentIds = typedGradeRows
      .filter((row) => row.status === "DRAFT")
      .map((row) => row.enrollment_id);

    if (!draftEnrollmentIds.length) {
      return {
        data: { offeringId },
        message: "Tất cả bản ghi điểm đã ở trạng thái SUBMITTED.",
        success: true,
      };
    }

    const { error } = await supabase
      .from("grades")
      .update({ status: "SUBMITTED" } as never)
      .in("enrollment_id", draftEnrollmentIds as never);

    if (error) {
      return { error: error.message, success: false };
    }

    await createAuditLog({
      action: "GRADE_SHEET_SUBMITTED",
      entityId: offeringId,
      entityType: "course_offerings",
      targetUserId: context.data.userId,
    });

    revalidatePath(`/lecturer/offerings/${offeringId}`);
    revalidatePath(`/lecturer/grades/${offeringId}`);
    revalidatePath("/admin/grades");

    return {
      data: { offeringId },
      message: "Đã gửi duyệt toàn bộ bảng điểm.",
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return { error: message, success: false };
  }
}

export async function submitOfferingGradesFormAction(formData: FormData) {
  const offeringId = formData.get("offering_id");
  if (typeof offeringId !== "string" || !offeringId) {
    redirect("/lecturer/offerings");
  }

  const returnPath = resolveGradebookReturnPath(formData, offeringId);
  const result = await submitOfferingGradesAction(formData);

  if (!result.success) {
    redirectToGradebook(returnPath, "error", result.error);
  }

  redirectToGradebook(
    returnPath,
    "success",
    result.message ?? "Đã gửi duyệt bảng điểm.",
  );
}
