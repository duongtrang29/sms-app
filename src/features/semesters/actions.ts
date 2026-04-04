"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import {
  buildPathWithUpdates,
  getSafeReturnPath,
  getStringField,
} from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createClient } from "@/lib/supabase/server";
import { semesterSchema } from "@/features/semesters/schemas";
import type { ActionState } from "@/types/app";

function redirectToSemesters(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

export async function upsertSemesterAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getSafeReturnPath(
    formData,
    "/admin/semesters",
    "/admin/semesters",
  );

  const parsed = parseWithSchema(semesterSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin học kỳ chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const payload = {
    academic_year: parsed.data.academic_year,
    code: parsed.data.code.toUpperCase(),
    end_date: parsed.data.end_date,
    enrollment_end: parsed.data.enrollment_end,
    enrollment_start: parsed.data.enrollment_start,
    is_current: parsed.data.is_current === "YES",
    max_credits: parsed.data.max_credits,
    name: parsed.data.name,
    regrade_close_at: parsed.data.regrade_close_at || null,
    regrade_open_at: parsed.data.regrade_open_at || null,
    start_date: parsed.data.start_date,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("semesters")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã học kỳ đã tồn tại.",
          test: ["semesters_code_key", "duplicate key"],
        },
        {
          field: "end_date",
          message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
          test: "semesters_date_check",
        },
        {
          field: "enrollment_end",
          message: "Ngày đóng đăng ký phải sau ngày mở đăng ký.",
          test: "semesters_enrollment_window_check",
        },
        {
          field: "regrade_close_at",
          message: "Ngày đóng phúc khảo phải sau ngày mở phúc khảo.",
          test: "semesters_regrade_window_check",
        },
      ]);

      return failure(
        fieldErrors
          ? Object.values(fieldErrors)[0]?.[0] ?? "Không thể cập nhật học kỳ."
          : "Không thể cập nhật học kỳ.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "SEMESTER_UPDATED",
      entityId: parsed.data.id,
      entityType: "semesters",
    });
  } else {
    const { data, error } = await supabase
      .from("semesters")
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "code",
          message: "Mã học kỳ đã tồn tại.",
          test: ["semesters_code_key", "duplicate key"],
        },
        {
          field: "end_date",
          message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
          test: "semesters_date_check",
        },
        {
          field: "enrollment_end",
          message: "Ngày đóng đăng ký phải sau ngày mở đăng ký.",
          test: "semesters_enrollment_window_check",
        },
        {
          field: "regrade_close_at",
          message: "Ngày đóng phúc khảo phải sau ngày mở phúc khảo.",
          test: "semesters_regrade_window_check",
        },
      ]);

      return failure(
        fieldErrors
          ? Object.values(fieldErrors)[0]?.[0] ?? "Không thể tạo học kỳ."
          : "Không thể tạo học kỳ.",
        fieldErrors,
      );
    }

    await createAuditLog({
      action: "SEMESTER_CREATED",
      entityId: (data as { id: string }).id,
      entityType: "semesters",
    });
  }

  revalidatePath("/admin/semesters");
  redirectToSemesters(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật học kỳ." : "Đã tạo học kỳ mới.",
  );
}

export async function deleteSemesterFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getSafeReturnPath(
    formData,
    "/admin/semesters",
    "/admin/semesters",
  );
  const semesterId = getStringField(formData, "semester_id");

  if (!semesterId) {
    redirectToSemesters(returnPath, "error", "Thiếu học kỳ cần xóa.");
  }

  const supabase = await createClient();
  const { count, error: offeringError } = await supabase
    .from("course_offerings")
    .select("id", { count: "exact", head: true })
    .eq("semester_id", semesterId);

  if (offeringError) {
    redirectToSemesters(returnPath, "error", offeringError.message);
  }

  if ((count ?? 0) > 0) {
    redirectToSemesters(
      returnPath,
      "error",
      "Học kỳ đã có học phần mở, không thể xóa.",
    );
  }

  const { error: deleteError } = await supabase
    .from("semesters")
    .delete()
    .eq("id", semesterId);

  if (deleteError) {
    redirectToSemesters(returnPath, "error", deleteError.message);
  }

  await createAuditLog({
    action: "SEMESTER_DELETED",
    entityId: semesterId,
    entityType: "semesters",
  });

  revalidatePath("/admin/semesters");
  revalidatePath("/admin/offerings");
  redirectToSemesters(returnPath, "success", "Đã xóa học kỳ.");
}
