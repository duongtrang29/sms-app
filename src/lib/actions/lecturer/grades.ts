"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseSupabaseError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

type ActionSuccess<T> = {
  data: T;
  message?: string;
  success: true;
};

type ActionFailure = {
  error: string;
  issues?: Record<string, string[]>;
  success: false;
};

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

type SavedGradeRow = {
  attendance_score: number | null;
  enrollment_id: string;
  final_score: number | null;
  gpa_value: number | null;
  letter_grade: string | null;
  midterm_score: number | null;
  status: "APPROVED" | "DRAFT" | "LOCKED" | "SUBMITTED";
  total_score: number | null;
};

const uuidSchema = z.string().uuid();

const scoreSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return Number(trimmed);
  }

  return value;
}, z.number().min(0).max(10).nullable());

const gradeRowSchema = z.object({
  attendanceScore: scoreSchema,
  enrollmentId: uuidSchema,
  finalScore: scoreSchema,
  midtermScore: scoreSchema,
  remark: z.string().trim().max(500).nullish(),
});

const saveDraftSchema = z.object({
  offeringId: uuidSchema,
  rows: z.array(gradeRowSchema).min(1),
});

const submitSchema = z.object({
  offeringId: uuidSchema,
});

async function requireLecturer() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: parseSupabaseError(error, "Bạn chưa đăng nhập."),
      success: false as const,
      supabase,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_code, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: parseSupabaseError(
        profileError,
        "Không thể kiểm tra thông tin giảng viên.",
      ),
      success: false as const,
      supabase,
    };
  }

  const resolved = profile as { role_code: string; status: string } | null;
  if (!resolved || resolved.role_code !== "LECTURER" || resolved.status !== "ACTIVE") {
    return {
      error: "Bạn không có quyền nhập điểm.",
      success: false as const,
      supabase,
    };
  }

  return { success: true as const, supabase, userId: user.id };
}

async function ensureLecturerOwnsOffering(
  offeringId: string,
  lecturerId: string,
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("teaching_assignments")
    .select("id")
    .eq("course_offering_id", offeringId)
    .eq("lecturer_id", lecturerId)
    .limit(1);

  if (error) {
    return {
      error: parseSupabaseError(error, "Không thể kiểm tra phân công giảng dạy."),
      success: false as const,
    };
  }

  if (!data?.length) {
    return {
      error: "Bạn không được phân công giảng dạy học phần này.",
      success: false as const,
    };
  }

  return { success: true as const };
}

function invalidInput(error: z.ZodError): ActionFailure {
  return {
    error: "Dữ liệu không hợp lệ.",
    issues: error.flatten().fieldErrors as Record<string, string[]>,
    success: false,
  };
}

function revalidateGradePaths(offeringId: string) {
  revalidatePath(`/lecturer/offerings/${offeringId}`);
  revalidatePath(`/lecturer/grades/${offeringId}`);
  revalidatePath("/admin/grades");
  revalidatePath("/student/grades");
}

export async function saveDraftGrades(
  input: unknown,
): Promise<ActionResult<{ rows: SavedGradeRow[]; updatedCount: number }>> {
  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    const context = await requireLecturer();
    if (!context.success) {
      return { error: context.error, success: false };
    }

    const ownership = await ensureLecturerOwnsOffering(
      parsed.data.offeringId,
      context.userId,
    );
    if (!ownership.success) {
      return { error: ownership.error, success: false };
    }

    const enrollmentIds = parsed.data.rows.map((row) => row.enrollmentId);
    const { data: enrollments, error: enrollmentError } = await context.supabase
      .from("enrollments")
      .select("id")
      .eq("course_offering_id", parsed.data.offeringId)
      .in("id", enrollmentIds);

    if (enrollmentError) {
      return {
        error: parseSupabaseError(enrollmentError, "Không thể kiểm tra danh sách sinh viên."),
        success: false,
      };
    }

    const validIds = new Set(
      ((enrollments as Array<{ id: string }> | null) ?? []).map((item) => item.id),
    );
    const invalidRows = parsed.data.rows.filter((row) => !validIds.has(row.enrollmentId));
    if (invalidRows.length > 0) {
      return {
        error: "Có bản ghi điểm không thuộc học phần này.",
        success: false,
      };
    }

    const upsertRows = parsed.data.rows.map((row) => ({
      attendance_score: row.attendanceScore,
      enrollment_id: row.enrollmentId,
      final_score: row.finalScore,
      midterm_score: row.midtermScore,
      remark: row.remark || null,
      status: "DRAFT" as const,
    }));

    const { data: updated, error: upsertError } = await context.supabase
      .from("grades")
      .upsert(upsertRows as never, { onConflict: "enrollment_id" })
      .select("id");

    if (upsertError) {
      return {
        error: parseSupabaseError(upsertError, "Không thể lưu bảng điểm nháp."),
        success: false,
      };
    }

    const updatedRows = (updated as Array<{ id: string }> | null) ?? [];
    const { data: refreshedRows, error: refreshedError } = await context.supabase
      .from("grades")
      .select(
        "enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade, gpa_value, status",
      )
      .in("enrollment_id", enrollmentIds as never);

    if (refreshedError) {
      return {
        error: parseSupabaseError(
          refreshedError,
          "Đã lưu điểm nhưng không thể tải lại kết quả sau trigger.",
        ),
        success: false,
      };
    }

    revalidateGradePaths(parsed.data.offeringId);
    return {
      data: {
        rows: ((refreshedRows as SavedGradeRow[] | null) ?? []).sort((left, right) =>
          left.enrollment_id.localeCompare(right.enrollment_id),
        ),
        updatedCount: updatedRows.length || upsertRows.length,
      },
      message: "Đã lưu điểm nháp.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function submitGrades(
  input: unknown,
): Promise<ActionResult<{ submittedCount: number }>> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    const context = await requireLecturer();
    if (!context.success) {
      return { error: context.error, success: false };
    }

    const ownership = await ensureLecturerOwnsOffering(
      parsed.data.offeringId,
      context.userId,
    );
    if (!ownership.success) {
      return { error: ownership.error, success: false };
    }

    const { data: enrollments, error: enrollmentError } = await context.supabase
      .from("enrollments")
      .select("id")
      .eq("course_offering_id", parsed.data.offeringId)
      .neq("status", "DROPPED");

    if (enrollmentError) {
      return {
        error: parseSupabaseError(enrollmentError, "Không thể tải danh sách enrollment."),
        success: false,
      };
    }

    const enrollmentIds = (
      (enrollments as Array<{ id: string }> | null) ?? []
    ).map((item) => item.id);
    if (enrollmentIds.length === 0) {
      return {
        error: "Học phần chưa có sinh viên đăng ký.",
        success: false,
      };
    }

    const { data: draftRows, error: draftLookupError } = await context.supabase
      .from("grades")
      .select("enrollment_id, attendance_score, midterm_score, final_score, status")
      .in("enrollment_id", enrollmentIds as never);

    if (draftLookupError) {
      return {
        error: parseSupabaseError(
          draftLookupError,
          "Không thể kiểm tra dữ liệu điểm trước khi gửi duyệt.",
        ),
        success: false,
      };
    }

    const typedRows =
      ((draftRows as Array<{
        attendance_score: number | null;
        enrollment_id: string;
        final_score: number | null;
        midterm_score: number | null;
        status: "APPROVED" | "DRAFT" | "LOCKED" | "SUBMITTED";
      }> | null) ?? []);

    const missingCount = enrollmentIds.filter(
      (enrollmentId) => !typedRows.some((row) => row.enrollment_id === enrollmentId),
    ).length;
    if (missingCount > 0) {
      return {
        error: `Có ${missingCount} sinh viên chưa có bản ghi điểm, chưa thể gửi duyệt.`,
        success: false,
      };
    }

    const incompleteCount = typedRows.filter(
      (row) =>
        row.status === "DRAFT" &&
        (row.attendance_score === null ||
          row.midterm_score === null ||
          row.final_score === null),
    ).length;

    if (incompleteCount > 0) {
      return {
        error: `Có ${incompleteCount} bản ghi còn thiếu điểm thành phần.`,
        success: false,
      };
    }

    const { data: updatedRows, error: updateError } = await context.supabase
      .from("grades")
      .update({ status: "SUBMITTED" } as never)
      .eq("status", "DRAFT")
      .in("enrollment_id", enrollmentIds)
      .select("id");

    if (updateError) {
      return {
        error: parseSupabaseError(updateError, "Không thể gửi duyệt bảng điểm."),
        success: false,
      };
    }

    const submittedRows = (updatedRows as Array<{ id: string }> | null) ?? [];
    revalidateGradePaths(parsed.data.offeringId);
    return {
      data: { submittedCount: submittedRows.length },
      message: "Đã gửi duyệt bảng điểm.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}
