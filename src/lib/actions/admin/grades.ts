"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseSupabaseError } from "@/lib/errors";
import {
  createAdminClient,
  createServerClient,
} from "@/lib/supabase/server";
import type { Json } from "@/types/database";

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

const offeringSchema = z.object({
  offeringId: z.string().uuid(),
});

const rejectSchema = offeringSchema.extend({
  reason: z.string().trim().min(3).max(1000),
});

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: parseSupabaseError(error, "Bạn chưa đăng nhập."),
      success: false as const,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_code, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: parseSupabaseError(profileError, "Không thể kiểm tra quyền quản trị."),
      success: false as const,
    };
  }

  const resolved = profile as { role_code: string; status: string } | null;
  if (!resolved || resolved.role_code !== "ADMIN" || resolved.status !== "ACTIVE") {
    return {
      error: "Bạn không có quyền thực hiện thao tác quản trị điểm.",
      success: false as const,
    };
  }

  return { adminId: user.id, success: true as const };
}

function invalidInput(error: z.ZodError): ActionFailure {
  return {
    error: "Dữ liệu không hợp lệ.",
    issues: error.flatten().fieldErrors as Record<string, string[]>,
    success: false,
  };
}

async function getEnrollmentIdsByOffering(offeringId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_offering_id", offeringId)
    .neq("status", "DROPPED");

  if (error) {
    return {
      error: parseSupabaseError(error, "Không thể tải danh sách enrollment."),
      success: false as const,
    };
  }

  const enrollmentIds = ((data as Array<{ id: string }> | null) ?? []).map(
    (item) => item.id,
  );
  return { enrollmentIds, success: true as const };
}

function revalidateGradePaths(offeringId: string) {
  revalidatePath("/admin/grades");
  revalidatePath("/student/grades");
  revalidatePath(`/lecturer/offerings/${offeringId}`);
  revalidatePath(`/lecturer/grades/${offeringId}`);
}

export async function approveGradeSheet(
  input: unknown,
): Promise<ActionResult<{ approvedCount: number }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return { error: guard.error, success: false };
  }

  const parsed = offeringSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    const enrollmentResult = await getEnrollmentIdsByOffering(parsed.data.offeringId);
    if (!enrollmentResult.success) {
      return { error: enrollmentResult.error, success: false };
    }

    if (enrollmentResult.enrollmentIds.length === 0) {
      return { error: "Học phần chưa có enrollment hợp lệ.", success: false };
    }

    const supabase = createAdminClient();
    const { data: updatedRows, error } = await supabase
      .from("grades")
      .update({ status: "APPROVED" } as never)
      .eq("status", "SUBMITTED")
      .in("enrollment_id", enrollmentResult.enrollmentIds)
      .select("id");

    if (error) {
      return {
        error: parseSupabaseError(error, "Không thể duyệt bảng điểm."),
        success: false,
      };
    }

    const approvedRows = (updatedRows as Array<{ id: string }> | null) ?? [];
    revalidateGradePaths(parsed.data.offeringId);
    return {
      data: { approvedCount: approvedRows.length },
      message: "Duyệt bảng điểm thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function rejectGradeSheet(
  input: unknown,
): Promise<ActionResult<{ rejectedCount: number }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return { error: guard.error, success: false };
  }

  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    const enrollmentResult = await getEnrollmentIdsByOffering(parsed.data.offeringId);
    if (!enrollmentResult.success) {
      return { error: enrollmentResult.error, success: false };
    }

    if (enrollmentResult.enrollmentIds.length === 0) {
      return { error: "Học phần chưa có enrollment hợp lệ.", success: false };
    }

    const supabase = createAdminClient();
    const { data: targetRows, error: targetError } = await supabase
      .from("grades")
      .select("id, status")
      .in("enrollment_id", enrollmentResult.enrollmentIds)
      .in("status", ["SUBMITTED", "APPROVED"] as never);

    if (targetError) {
      return {
        error: parseSupabaseError(targetError, "Không thể tải danh sách điểm cần trả lại."),
        success: false,
      };
    }

    const gradeTargets =
      (targetRows as Array<{ id: string; status: string }> | null) ?? [];
    if (gradeTargets.length === 0) {
      return {
        error: "Không có bảng điểm ở trạng thái SUBMITTED/APPROVED để trả lại.",
        success: false,
      };
    }

    const targetIds = gradeTargets.map((row) => row.id);
    const { data: updatedRows, error: updateError } = await supabase
      .from("grades")
      .update({ status: "DRAFT" } as never)
      .in("id", targetIds)
      .select("id");

    if (updateError) {
      return {
        error: parseSupabaseError(updateError, "Không thể trả bảng điểm về DRAFT."),
        success: false,
      };
    }

    const changedBy = guard.adminId;
    const logRows = gradeTargets.map((row) => ({
      change_type: "ADMIN_REJECT_TO_DRAFT",
      changed_by: changedBy,
      grade_id: row.id,
      new_payload: {
        reason: parsed.data.reason,
        status: "DRAFT",
      } satisfies Json,
      note: parsed.data.reason,
      old_payload: {
        status: row.status,
      } satisfies Json,
    }));

    const { error: logError } = await supabase
      .from("grade_change_logs")
      .insert(logRows as never);

    if (logError) {
      return {
        error: parseSupabaseError(logError, "Đã trả bảng điểm về DRAFT nhưng không ghi được lý do."),
        success: false,
      };
    }

    const rejectedRows = (updatedRows as Array<{ id: string }> | null) ?? [];
    revalidateGradePaths(parsed.data.offeringId);
    return {
      data: { rejectedCount: rejectedRows.length || gradeTargets.length },
      message: "Đã trả bảng điểm về DRAFT.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function lockGradeSheet(
  input: unknown,
): Promise<ActionResult<{ lockedCount: number }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return { error: guard.error, success: false };
  }

  const parsed = offeringSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    const enrollmentResult = await getEnrollmentIdsByOffering(parsed.data.offeringId);
    if (!enrollmentResult.success) {
      return { error: enrollmentResult.error, success: false };
    }

    if (enrollmentResult.enrollmentIds.length === 0) {
      return { error: "Học phần chưa có enrollment hợp lệ.", success: false };
    }

    const supabase = createAdminClient();
    const { data: updatedRows, error } = await supabase
      .from("grades")
      .update({ status: "LOCKED" } as never)
      .eq("status", "APPROVED")
      .in("enrollment_id", enrollmentResult.enrollmentIds)
      .select("id");

    if (error) {
      return {
        error: parseSupabaseError(error, "Không thể khóa bảng điểm."),
        success: false,
      };
    }

    const lockedRows = (updatedRows as Array<{ id: string }> | null) ?? [];
    revalidateGradePaths(parsed.data.offeringId);
    return {
      data: { lockedCount: lockedRows.length },
      message: "Khóa bảng điểm thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function unlockGradeSheet(
  input: unknown,
): Promise<ActionResult<{ unlockedCount: number }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return { error: guard.error, success: false };
  }

  const parsed = offeringSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    const enrollmentResult = await getEnrollmentIdsByOffering(parsed.data.offeringId);
    if (!enrollmentResult.success) {
      return { error: enrollmentResult.error, success: false };
    }

    if (enrollmentResult.enrollmentIds.length === 0) {
      return { error: "Học phần chưa có enrollment hợp lệ.", success: false };
    }

    const supabase = createAdminClient();
    const { data: updatedRows, error } = await supabase
      .from("grades")
      .update({ status: "APPROVED" } as never)
      .eq("status", "LOCKED")
      .in("enrollment_id", enrollmentResult.enrollmentIds)
      .select("id");

    if (error) {
      return {
        error: parseSupabaseError(error, "Không thể mở khóa bảng điểm."),
        success: false,
      };
    }

    const unlockedRows = (updatedRows as Array<{ id: string }> | null) ?? [];
    revalidateGradePaths(parsed.data.offeringId);
    return {
      data: { unlockedCount: unlockedRows.length },
      message: "Mở khóa bảng điểm thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}
