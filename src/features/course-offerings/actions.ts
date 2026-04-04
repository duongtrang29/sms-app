"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createClient } from "@/lib/supabase/server";
import { courseOfferingSchema } from "@/features/course-offerings/schemas";
import type { ActionState } from "@/types/app";

function getStringField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : null;
}

function getReturnPath(formData: FormData) {
  const returnTo = getStringField(formData, "return_to");
  return returnTo && returnTo.startsWith("/admin/offerings")
    ? returnTo
    : "/admin/offerings";
}

function redirectToOfferings(
  returnPath: string,
  type: "error" | "success",
  message: string,
): never {
  const url = new URL(`http://local${returnPath}`);
  url.searchParams.set(type, message);
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

export async function upsertCourseOfferingAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const parsed = parseWithSchema(courseOfferingSchema, formData);

  if (!parsed.success) {
    return failure("Thông tin học phần mở chưa hợp lệ.", parsed.errors);
  }

  const supabase = await createClient();
  const payload = {
    attendance_weight: parsed.data.attendance_weight,
    course_id: parsed.data.course_id,
    final_weight: parsed.data.final_weight,
    max_capacity: parsed.data.max_capacity,
    midterm_weight: parsed.data.midterm_weight,
    notes: parsed.data.notes || null,
    passing_score: parsed.data.passing_score,
    registration_close_at: parsed.data.registration_close_at,
    registration_open_at: parsed.data.registration_open_at,
    section_code: parsed.data.section_code.toUpperCase(),
    semester_id: parsed.data.semester_id,
    status: parsed.data.status,
    title: parsed.data.title || null,
  };

  let offeringId = parsed.data.id;

  if (parsed.data.id) {
    const { error } = await supabase
      .from("course_offerings")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "section_code",
          message: "Nhóm học phần đã tồn tại trong học kỳ của môn học này.",
          test: "course_offerings_unique_section",
        },
      ]);

      return failure(
        fieldErrors?.section_code?.[0] ?? "Không thể cập nhật học phần mở.",
        fieldErrors,
      );
    }
  } else {
    const { data, error } = await supabase
      .from("course_offerings")
      .insert(payload as never)
      .select("id")
      .single();

    if (error) {
      const fieldErrors = matchServerFieldErrors(error.message, [
        {
          field: "section_code",
          message: "Nhóm học phần đã tồn tại trong học kỳ của môn học này.",
          test: "course_offerings_unique_section",
        },
      ]);

      return failure(
        fieldErrors?.section_code?.[0] ?? "Không thể tạo học phần mở.",
        fieldErrors,
      );
    }

    offeringId = (data as { id: string }).id;
  }

  if (!offeringId) {
    return failure("Không xác định được học phần mở.");
  }

  const { error: assignmentDeleteError } = await supabase
    .from("teaching_assignments")
    .delete()
    .eq("course_offering_id", offeringId);

  if (assignmentDeleteError) {
    return failure("Không thể cập nhật giảng viên cho học phần.", {
      lecturer_id: ["Không thể cập nhật giảng viên cho học phần."],
    });
  }

  if (parsed.data.lecturer_id) {
    const { error: assignmentError } = await supabase
      .from("teaching_assignments")
      .insert({
        assignment_role: "PRIMARY",
        course_offering_id: offeringId,
        is_primary: true,
        lecturer_id: parsed.data.lecturer_id,
      } as never);

    if (assignmentError) {
      return failure("Không thể gán giảng viên cho học phần.", {
        lecturer_id: ["Không thể gán giảng viên cho học phần."],
      });
    }
  }

  await createAuditLog({
    action: parsed.data.id
      ? "COURSE_OFFERING_UPDATED"
      : "COURSE_OFFERING_CREATED",
    entityId: offeringId,
    entityType: "course_offerings",
  });

  revalidatePath("/admin/offerings");
  revalidatePath("/admin/schedules");
  redirectToOfferings(
    returnPath,
    "success",
    parsed.data.id ? "Đã cập nhật học phần mở." : "Đã mở học phần mới.",
  );
}

export async function deleteCourseOfferingFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");

  if (!offeringId) {
    redirectToOfferings(returnPath, "error", "Thiếu học phần mở cần xóa.");
  }

  const supabase = await createClient();
  const { count: enrollmentCount, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_offering_id", offeringId);

  if (enrollmentError) {
    redirectToOfferings(returnPath, "error", enrollmentError.message);
  }

  if ((enrollmentCount ?? 0) > 0) {
    redirectToOfferings(
      returnPath,
      "error",
      "Học phần đã có đăng ký hoặc lịch sử học tập, không thể xóa.",
    );
  }

  const { error: deleteError } = await supabase
    .from("course_offerings")
    .delete()
    .eq("id", offeringId);

  if (deleteError) {
    redirectToOfferings(returnPath, "error", deleteError.message);
  }

  await createAuditLog({
    action: "COURSE_OFFERING_DELETED",
    entityId: offeringId,
    entityType: "course_offerings",
  });

  revalidatePath("/admin/offerings");
  revalidatePath("/admin/schedules");
  redirectToOfferings(returnPath, "success", "Đã xóa học phần mở.");
}
