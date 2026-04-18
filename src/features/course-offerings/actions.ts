"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { failure, parseWithSchema } from "@/lib/actions";
import { buildPathWithUpdates } from "@/lib/admin-routing";
import { createAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { parseSupabaseError } from "@/lib/errors";
import { matchServerFieldErrors } from "@/lib/form-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseOfferingSchema } from "@/features/course-offerings/schemas";
import type { ActionState } from "@/types/app";
import type { Database } from "@/types/database";

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
  redirect(buildPathWithUpdates(returnPath, [[type, message]]));
}

function revalidateOfferingPaths(offeringId?: string) {
  revalidatePath("/admin/offerings");
  revalidatePath("/admin");
  revalidatePath("/admin/schedules");
  if (offeringId) {
    revalidatePath(`/lecturer/offerings/${offeringId}`);
  }
  revalidatePath("/student/enrollment");
  revalidatePath("/student/enrollments");
  revalidatePath("/student/schedule");
}

async function ensureLecturerExists(lecturerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lecturers")
    .select("id")
    .eq("id", lecturerId)
    .maybeSingle();

  if (error) {
    return {
      error: parseSupabaseError(error, "Không thể kiểm tra thông tin giảng viên."),
      success: false as const,
    };
  }

  if (!data) {
    return {
      error: "Giảng viên không tồn tại trong hệ thống.",
      success: false as const,
    };
  }

  return { success: true as const };
}

async function upsertPrimaryAssignment(
  offeringId: string,
  lecturerId: string | null,
) {
  const supabase = createAdminClient();

  if (!lecturerId) {
    const { error } = await supabase
      .from("teaching_assignments")
      .delete()
      .eq("course_offering_id", offeringId)
      .eq("is_primary", true);

    if (error) {
      return {
        error: parseSupabaseError(error, "Không thể cập nhật giảng viên chính."),
        success: false as const,
      };
    }

    return { success: true as const };
  }

  const lecturerExists = await ensureLecturerExists(lecturerId);
  if (!lecturerExists.success) {
    return lecturerExists;
  }

  const { error: resetError } = await supabase
    .from("teaching_assignments")
    .update({ is_primary: false } as never)
    .eq("course_offering_id", offeringId)
    .eq("is_primary", true);

  if (resetError) {
    return {
      error: parseSupabaseError(resetError, "Không thể cập nhật giảng viên chính."),
      success: false as const,
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("teaching_assignments")
    .select("id")
    .eq("course_offering_id", offeringId)
    .eq("lecturer_id", lecturerId)
    .maybeSingle();

  if (existingError) {
    return {
      error: parseSupabaseError(
        existingError,
        "Không thể kiểm tra phân công giảng viên.",
      ),
      success: false as const,
    };
  }

  const existingAssignment = existing as { id: string } | null;
  if (existingAssignment?.id) {
    const { error: updateError } = await supabase
      .from("teaching_assignments")
      .update({ assignment_role: "LECTURER", is_primary: true } as never)
      .eq("id", existingAssignment.id);

    if (updateError) {
      return {
        error: parseSupabaseError(updateError, "Không thể cập nhật phân công giảng viên."),
        success: false as const,
      };
    }

    return { success: true as const };
  }

  const { error: insertError } = await supabase.from("teaching_assignments").insert({
    assignment_role: "LECTURER",
    course_offering_id: offeringId,
    is_primary: true,
    lecturer_id: lecturerId,
  } as never);

  if (insertError) {
    return {
      error: parseSupabaseError(insertError, "Không thể phân công giảng viên."),
      success: false as const,
    };
  }

  return { success: true as const };
}

async function hasRoomConflict(input: {
  dayOfWeek: number;
  endDate: string | null;
  endTime: string;
  excludeScheduleId?: string;
  roomId: string;
  startDate: string | null;
  startTime: string;
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("schedules")
    .select("id")
    .eq("room_id", input.roomId)
    .eq("day_of_week", input.dayOfWeek)
    .lt("start_time", input.endTime)
    .gt("end_time", input.startTime)
    .limit(1);

  if (input.excludeScheduleId) {
    query = query.neq("id", input.excludeScheduleId);
  }

  if (input.startDate) {
    query = query.or(`end_date.is.null,end_date.gte.${input.startDate}`);
  }

  if (input.endDate) {
    query = query.or(`start_date.is.null,start_date.lte.${input.endDate}`);
  }

  const { data, error } = await query;
  if (error) {
    return {
      error: parseSupabaseError(error, "Không thể kiểm tra trùng phòng học."),
      success: false as const,
    };
  }

  return {
    data: (data?.length ?? 0) > 0,
    success: true as const,
  };
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

  const payload: Database["public"]["Tables"]["course_offerings"]["Insert"] = {
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

  const supabase = createAdminClient();
  let offeringId = parsed.data.id ?? null;

  if (parsed.data.lecturer_id) {
    const lecturerExists = await ensureLecturerExists(parsed.data.lecturer_id);
    if (!lecturerExists.success) {
      return failure(lecturerExists.error, {
        lecturer_id: [lecturerExists.error],
      });
    }
  }

  if (parsed.data.id) {
    const { error: updateError } = await supabase
      .from("course_offerings")
      .update(payload as never)
      .eq("id", parsed.data.id);

    if (updateError) {
      const fieldErrors = matchServerFieldErrors(updateError.message, [
        {
          field: "section_code",
          message: "Nhóm học phần đã tồn tại trong học kỳ của môn học này.",
          test: ["duplicate key", "course_offerings"],
        },
      ]);

      return failure(
        fieldErrors?.section_code?.[0] ??
          parseSupabaseError(updateError, "Không thể cập nhật học phần mở."),
        fieldErrors,
      );
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("course_offerings")
      .insert(payload as never)
      .select("id")
      .single();

    if (insertError) {
      const fieldErrors = matchServerFieldErrors(insertError.message, [
        {
          field: "section_code",
          message: "Nhóm học phần đã tồn tại trong học kỳ của môn học này.",
          test: ["duplicate key", "course_offerings"],
        },
      ]);

      return failure(
        fieldErrors?.section_code?.[0] ??
          parseSupabaseError(insertError, "Không thể tạo học phần mở."),
        fieldErrors,
      );
    }

    offeringId = (inserted as { id: string } | null)?.id ?? null;
    if (!offeringId) {
      return failure("Không xác định được học phần mở vừa tạo.");
    }
  }

  const assignmentResult = await upsertPrimaryAssignment(
    offeringId ?? parsed.data.id!,
    parsed.data.lecturer_id ?? null,
  );

  if (!assignmentResult.success) {
    return failure(assignmentResult.error, {
      lecturer_id: [assignmentResult.error],
    });
  }

  await createAuditLog({
    action: parsed.data.id
      ? "COURSE_OFFERING_UPDATED"
      : "COURSE_OFFERING_CREATED",
    entityId: offeringId ?? parsed.data.id!,
    entityType: "course_offerings",
  });

  revalidateOfferingPaths(offeringId ?? parsed.data.id!);

  const successMessage = parsed.data.id
    ? "Đã cập nhật học phần mở."
    : "Tạo học phần thành công.";
  redirectToOfferings(returnPath, "success", successMessage);
}

export async function assignOfferingLecturerFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");
  const lecturerId = getStringField(formData, "lecturer_id");

  if (!offeringId || !lecturerId) {
    redirectToOfferings(returnPath, "error", "Thiếu thông tin phân công giảng viên.");
  }

  const assignmentResult = await upsertPrimaryAssignment(offeringId, lecturerId);
  if (!assignmentResult.success) {
    redirectToOfferings(returnPath, "error", assignmentResult.error);
  }

  revalidateOfferingPaths(offeringId);
  redirectToOfferings(returnPath, "success", "Phân công giảng viên thành công.");
}

export async function createOfferingScheduleFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");
  const roomId = getStringField(formData, "room_id");
  const startTime = getStringField(formData, "start_time");
  const endTime = getStringField(formData, "end_time");
  const dayOfWeekValue = getStringField(formData, "day_of_week");

  if (!offeringId || !roomId || !startTime || !endTime || !dayOfWeekValue) {
    redirectToOfferings(returnPath, "error", "Thiếu dữ liệu để tạo lịch học.");
  }

  const dayOfWeek = Number(dayOfWeekValue);
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    redirectToOfferings(returnPath, "error", "Thứ trong tuần không hợp lệ.");
  }

  const conflictResult = await hasRoomConflict({
    dayOfWeek,
    endDate: getStringField(formData, "end_date"),
    endTime,
    roomId,
    startDate: getStringField(formData, "start_date"),
    startTime,
  });

  if (!conflictResult.success) {
    redirectToOfferings(returnPath, "error", conflictResult.error);
  }

  if (conflictResult.data) {
    redirectToOfferings(
      returnPath,
      "error",
      "Phòng học bị trùng lịch trong khung giờ đã chọn.",
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("schedules").insert({
    course_offering_id: offeringId,
    day_of_week: dayOfWeek,
    end_date: getStringField(formData, "end_date"),
    end_time: endTime,
    note: getStringField(formData, "note"),
    room_id: roomId,
    start_date: getStringField(formData, "start_date"),
    start_time: startTime,
    week_pattern: getStringField(formData, "week_pattern") || "ALL",
  } as never);

  if (error) {
    redirectToOfferings(
      returnPath,
      "error",
      parseSupabaseError(error, "Không thể tạo lịch học."),
    );
  }

  revalidateOfferingPaths(offeringId);
  redirectToOfferings(returnPath, "success", "Tạo lịch học thành công.");
}

export async function openOfferingEnrollmentFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");
  if (!offeringId) {
    redirectToOfferings(returnPath, "error", "Thiếu học phần mở cần thao tác.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("course_offerings")
    .update({
      registration_open_at: new Date().toISOString(),
      status: "OPEN",
    } as never)
    .eq("id", offeringId);

  if (error) {
    redirectToOfferings(
      returnPath,
      "error",
      parseSupabaseError(error, "Không thể mở đăng ký học phần."),
    );
  }

  revalidateOfferingPaths(offeringId);
  redirectToOfferings(returnPath, "success", "Đã mở đăng ký học phần.");
}

export async function closeOfferingEnrollmentFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");
  if (!offeringId) {
    redirectToOfferings(returnPath, "error", "Thiếu học phần mở cần thao tác.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("course_offerings")
    .update({
      registration_close_at: new Date().toISOString(),
      status: "CLOSED",
    } as never)
    .eq("id", offeringId);

  if (error) {
    redirectToOfferings(
      returnPath,
      "error",
      parseSupabaseError(error, "Không thể đóng đăng ký học phần."),
    );
  }

  revalidateOfferingPaths(offeringId);
  redirectToOfferings(returnPath, "success", "Đã đóng đăng ký học phần.");
}

export async function deleteCourseOfferingFormAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const returnPath = getReturnPath(formData);
  const offeringId = getStringField(formData, "offering_id");

  if (!offeringId) {
    redirectToOfferings(returnPath, "error", "Thiếu học phần mở cần xóa.");
  }

  const supabase = createAdminClient();
  const { count: enrollmentCount, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_offering_id", offeringId);

  if (enrollmentError) {
    redirectToOfferings(
      returnPath,
      "error",
      parseSupabaseError(enrollmentError, "Không thể kiểm tra dữ liệu đăng ký."),
    );
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
    redirectToOfferings(
      returnPath,
      "error",
      parseSupabaseError(deleteError, "Không thể xóa học phần mở."),
    );
  }

  await createAuditLog({
    action: "COURSE_OFFERING_DELETED",
    entityId: offeringId,
    entityType: "course_offerings",
  });

  revalidateOfferingPaths(offeringId);
  redirectToOfferings(returnPath, "success", "Đã xóa học phần mở.");
}
