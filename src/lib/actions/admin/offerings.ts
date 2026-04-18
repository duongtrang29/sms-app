"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseSupabaseError } from "@/lib/errors";
import {
  createAdminClient,
  createServerClient,
} from "@/lib/supabase/server";
import type { Enums, TablesInsert } from "@/types/database";

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

const uuidSchema = z.string().uuid();

const boolSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "primary"].includes(normalized);
  }

  return Boolean(value);
}, z.boolean());

const offeringStatusSchema = z.enum([
  "DRAFT",
  "OPEN",
  "CLOSED",
  "FINISHED",
  "CANCELLED",
]);

const scheduleInputSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  endDate: z.string().trim().nullish(),
  endTime: z.string().trim().min(5),
  note: z.string().trim().max(500).nullish(),
  roomId: uuidSchema,
  startDate: z.string().trim().nullish(),
  startTime: z.string().trim().min(5),
  weekPattern: z.string().trim().max(40).default("ALL"),
});

const createOfferingSchema = z.object({
  attendanceWeight: z.coerce.number().min(0).max(100).default(0.1),
  courseId: uuidSchema,
  finalWeight: z.coerce.number().min(0).max(100).default(0.5),
  initialSchedule: scheduleInputSchema.optional(),
  lecturerId: uuidSchema.nullish(),
  maxCapacity: z.coerce.number().int().min(1).max(5000),
  midtermWeight: z.coerce.number().min(0).max(100).default(0.4),
  notes: z.string().trim().max(2000).nullish(),
  passingScore: z.coerce.number().min(0).max(10).default(5),
  registrationCloseAt: z.string().trim().min(10),
  registrationOpenAt: z.string().trim().min(10),
  sectionCode: z.string().trim().min(1).max(20),
  semesterId: uuidSchema,
  status: offeringStatusSchema.default("DRAFT"),
  title: z.string().trim().max(255).nullish(),
});

const assignLecturerSchema = z.object({
  isPrimary: boolSchema.default(true),
  lecturerId: uuidSchema,
  offeringId: uuidSchema,
  role: z.string().trim().max(50).default("LECTURER"),
});

const createScheduleSchema = scheduleInputSchema.extend({
  offeringId: uuidSchema,
});

const offeringIdSchema = z.object({
  offeringId: uuidSchema,
});

const rejectOpenCloseSchema = z.object({
  closeAt: z.string().trim().nullish(),
  offeringId: uuidSchema,
  openAt: z.string().trim().nullish(),
});

type AdminGuard = ActionResult<{ adminId: string }>;

async function requireAdmin(): Promise<AdminGuard> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: parseSupabaseError(userError, "Bạn chưa đăng nhập."),
        success: false,
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
          "Không thể kiểm tra quyền tài khoản.",
        ),
        success: false,
      };
    }

    const resolved = profile as { role_code: string; status: string } | null;
    if (!resolved || resolved.role_code !== "ADMIN" || resolved.status !== "ACTIVE") {
      return {
        error: "Bạn không có quyền quản trị để thực hiện thao tác này.",
        success: false,
      };
    }

    return { data: { adminId: user.id }, success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

function invalidInput(error: z.ZodError): ActionFailure {
  return {
    error: "Dữ liệu không hợp lệ.",
    issues: error.flatten().fieldErrors as Record<string, string[]>,
    success: false,
  };
}

function revalidateOfferingPaths(offeringId?: string) {
  revalidatePath("/admin/offerings");
  revalidatePath("/admin/schedules");
  revalidatePath("/lecturer/offerings");
  revalidatePath("/student/enrollment");
  if (offeringId) {
    revalidatePath(`/lecturer/offerings/${offeringId}`);
  }
}

type RoomConflictInput = z.infer<typeof scheduleInputSchema> & {
  excludeScheduleId?: string;
};

async function hasRoomConflict(input: RoomConflictInput): Promise<boolean> {
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
    throw new Error(parseSupabaseError(error));
  }

  return (data?.length ?? 0) > 0;
}

export async function createOffering(
  input: unknown,
): Promise<ActionResult<{ offeringId: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = createOfferingSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    if (parsed.data.initialSchedule) {
      const conflict = await hasRoomConflict(parsed.data.initialSchedule);
      if (conflict) {
        return {
          error: "Phòng học bị trùng lịch trong khung thời gian đã chọn.",
          success: false,
        };
      }
    }

    const supabase = createAdminClient();
    const offeringPayload: TablesInsert<"course_offerings"> = {
      attendance_weight: parsed.data.attendanceWeight,
      course_id: parsed.data.courseId,
      final_weight: parsed.data.finalWeight,
      max_capacity: parsed.data.maxCapacity,
      midterm_weight: parsed.data.midtermWeight,
      notes: parsed.data.notes || null,
      passing_score: parsed.data.passingScore,
      registration_close_at: parsed.data.registrationCloseAt,
      registration_open_at: parsed.data.registrationOpenAt,
      section_code: parsed.data.sectionCode.toUpperCase(),
      semester_id: parsed.data.semesterId,
      status: parsed.data.status,
      title: parsed.data.title || null,
    };

    const { data: offering, error: offeringError } = await supabase
      .from("course_offerings")
      .insert(offeringPayload as never)
      .select("id")
      .single();
    const createdOffering = offering as { id: string } | null;

    if (offeringError || !createdOffering?.id) {
      return {
        error: parseSupabaseError(offeringError, "Không thể tạo học phần mở."),
        success: false,
      };
    }

    if (parsed.data.lecturerId) {
      const { error: assignError } = await supabase.from("teaching_assignments").insert({
        assignment_role: "LECTURER",
        course_offering_id: createdOffering.id,
        is_primary: true,
        lecturer_id: parsed.data.lecturerId,
      } as never);

      if (assignError) {
        return {
          error: parseSupabaseError(assignError, "Không thể phân công giảng viên."),
          success: false,
        };
      }
    }

    if (parsed.data.initialSchedule) {
      const { error: scheduleError } = await supabase.from("schedules").insert({
        course_offering_id: createdOffering.id,
        day_of_week: parsed.data.initialSchedule.dayOfWeek,
        end_date: parsed.data.initialSchedule.endDate || null,
        end_time: parsed.data.initialSchedule.endTime,
        note: parsed.data.initialSchedule.note || null,
        room_id: parsed.data.initialSchedule.roomId,
        start_date: parsed.data.initialSchedule.startDate || null,
        start_time: parsed.data.initialSchedule.startTime,
        week_pattern: parsed.data.initialSchedule.weekPattern,
      } as never);

      if (scheduleError) {
        return {
          error: parseSupabaseError(scheduleError, "Không thể tạo lịch học ban đầu."),
          success: false,
        };
      }
    }

    revalidateOfferingPaths(createdOffering.id);
    return {
      data: { offeringId: createdOffering.id },
      message: "Tạo học phần mở thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function assignLecturer(
  input: unknown,
): Promise<ActionResult<{ assignmentId: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = assignLecturerSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = createAdminClient();
  try {
    if (parsed.data.isPrimary) {
      const { error: clearPrimaryError } = await supabase
        .from("teaching_assignments")
        .update({ is_primary: false } as never)
        .eq("course_offering_id", parsed.data.offeringId)
        .eq("is_primary", true);

      if (clearPrimaryError) {
        return {
          error: parseSupabaseError(
            clearPrimaryError,
            "Không thể cập nhật giảng viên chính hiện tại.",
          ),
          success: false,
        };
      }
    }

    const { data: existing, error: existingError } = await supabase
      .from("teaching_assignments")
      .select("id")
      .eq("course_offering_id", parsed.data.offeringId)
      .eq("lecturer_id", parsed.data.lecturerId)
      .maybeSingle();
    const existingAssignment = existing as { id: string } | null;

    if (existingError) {
      return {
        error: parseSupabaseError(
          existingError,
          "Không thể kiểm tra phân công giảng viên.",
        ),
        success: false,
      };
    }

    if (existingAssignment?.id) {
      const { error: updateError } = await supabase
        .from("teaching_assignments")
        .update({
          assignment_role: parsed.data.role,
          is_primary: parsed.data.isPrimary,
        } as never)
        .eq("id", existingAssignment.id);

      if (updateError) {
        return {
          error: parseSupabaseError(updateError, "Không thể cập nhật phân công."),
          success: false,
        };
      }

      revalidateOfferingPaths(parsed.data.offeringId);
      return {
        data: { assignmentId: existingAssignment.id },
        message: "Cập nhật phân công giảng viên thành công.",
        success: true,
      };
    }

    const { data: created, error: insertError } = await supabase
      .from("teaching_assignments")
      .insert({
        assignment_role: parsed.data.role,
        course_offering_id: parsed.data.offeringId,
        is_primary: parsed.data.isPrimary,
        lecturer_id: parsed.data.lecturerId,
      } as never)
      .select("id")
      .single();
    const createdAssignment = created as { id: string } | null;

    if (insertError || !createdAssignment?.id) {
      return {
        error: parseSupabaseError(insertError, "Không thể phân công giảng viên."),
        success: false,
      };
    }

    revalidateOfferingPaths(parsed.data.offeringId);
    return {
      data: { assignmentId: createdAssignment.id },
      message: "Phân công giảng viên thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function createSchedule(
  input: unknown,
): Promise<ActionResult<{ scheduleId: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = createScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  try {
    const conflict = await hasRoomConflict(parsed.data);
    if (conflict) {
      return {
        error: "Phòng học bị trùng lịch trong khung thời gian đã chọn.",
        success: false,
      };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        course_offering_id: parsed.data.offeringId,
        day_of_week: parsed.data.dayOfWeek,
        end_date: parsed.data.endDate || null,
        end_time: parsed.data.endTime,
        note: parsed.data.note || null,
        room_id: parsed.data.roomId,
        start_date: parsed.data.startDate || null,
        start_time: parsed.data.startTime,
        week_pattern: parsed.data.weekPattern,
      } as never)
      .select("id")
      .single();
    const createdSchedule = data as { id: string } | null;

    if (error || !createdSchedule?.id) {
      return { error: parseSupabaseError(error, "Không thể tạo lịch học."), success: false };
    }

    revalidateOfferingPaths(parsed.data.offeringId);
    return {
      data: { scheduleId: createdSchedule.id },
      message: "Tạo lịch học thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function openEnrollment(input: unknown): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = rejectOpenCloseSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .from("course_offerings")
      .update({
        registration_close_at: parsed.data.closeAt || null,
        registration_open_at: parsed.data.openAt || new Date().toISOString(),
        status: "OPEN" satisfies Enums<"offering_status">,
      } as never)
      .eq("id", parsed.data.offeringId);

    if (error) {
      return {
        error: parseSupabaseError(error, "Không thể mở đăng ký học phần."),
        success: false,
      };
    }

    revalidateOfferingPaths(parsed.data.offeringId);
    return { data: undefined, message: "Đã mở đăng ký học phần.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function closeEnrollment(input: unknown): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = rejectOpenCloseSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .from("course_offerings")
      .update({
        registration_close_at: parsed.data.closeAt || new Date().toISOString(),
        status: "CLOSED" satisfies Enums<"offering_status">,
      } as never)
      .eq("id", parsed.data.offeringId);

    if (error) {
      return {
        error: parseSupabaseError(error, "Không thể đóng đăng ký học phần."),
        success: false,
      };
    }

    revalidateOfferingPaths(parsed.data.offeringId);
    return { data: undefined, message: "Đã đóng đăng ký học phần.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function deleteOffering(input: unknown): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = offeringIdSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const supabase = createAdminClient();
  try {
    const { count, error: countError } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_offering_id", parsed.data.offeringId);

    if (countError) {
      return {
        error: parseSupabaseError(countError, "Không thể kiểm tra dữ liệu đăng ký."),
        success: false,
      };
    }

    if ((count ?? 0) > 0) {
      return {
        error: "Không thể xóa học phần vì đã có sinh viên đăng ký.",
        success: false,
      };
    }

    const { error: deleteError } = await supabase
      .from("course_offerings")
      .delete()
      .eq("id", parsed.data.offeringId);

    if (deleteError) {
      return {
        error: parseSupabaseError(deleteError, "Không thể xóa học phần mở."),
        success: false,
      };
    }

    revalidateOfferingPaths(parsed.data.offeringId);
    return { data: undefined, message: "Xóa học phần mở thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}
