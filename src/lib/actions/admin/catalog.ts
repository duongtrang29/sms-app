"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { parseSupabaseError } from "@/lib/errors";
import {
  createAdminClient,
  createServerClient,
} from "@/lib/supabase/server";

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
    return ["1", "true", "yes", "active"].includes(normalized);
  }

  return Boolean(value);
}, z.boolean());

const statusBoolSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (normalized === "ACTIVE") {
      return true;
    }

    if (normalized === "INACTIVE") {
      return false;
    }
  }

  return value;
}, boolSchema);

const departmentSchema = z.object({
  code: z.string().trim().min(2).max(20),
  description: z.string().trim().max(1000).nullish(),
  id: uuidSchema.optional(),
  isActive: statusBoolSchema.default(true),
  name: z.string().trim().min(2).max(255),
});

const majorSchema = z.object({
  code: z.string().trim().min(2).max(20),
  degreeLevel: z.string().trim().max(50).default("Đại học"),
  departmentId: uuidSchema,
  id: uuidSchema.optional(),
  isActive: statusBoolSchema.default(true),
  name: z.string().trim().min(2).max(255),
});

const classSchema = z.object({
  code: z.string().trim().min(2).max(20),
  cohortYear: z.coerce.number().int().min(1990).max(2100),
  id: uuidSchema.optional(),
  isActive: statusBoolSchema.default(true),
  majorId: uuidSchema,
  name: z.string().trim().min(2).max(255),
});

const semesterSchema = z.object({
  academicYear: z.string().trim().min(4).max(20),
  code: z.string().trim().min(2).max(20),
  endDate: z.string().trim().min(10),
  enrollmentEnd: z.string().trim().min(10),
  enrollmentStart: z.string().trim().min(10),
  id: uuidSchema.optional(),
  isCurrent: boolSchema.default(false),
  maxCredits: z.coerce.number().int().min(1).max(60),
  name: z.string().trim().min(2).max(255),
  regradeCloseAt: z.string().trim().nullish(),
  regradeOpenAt: z.string().trim().nullish(),
  startDate: z.string().trim().min(10),
});

const roomSchema = z.object({
  building: z.string().trim().max(255).nullish(),
  capacity: z.coerce.number().int().min(1).max(2000),
  code: z.string().trim().min(2).max(20),
  id: uuidSchema.optional(),
  isActive: statusBoolSchema.default(true),
  name: z.string().trim().min(2).max(255),
});

const subjectSchema = z.object({
  code: z.string().trim().min(2).max(20),
  creditHours: z.coerce.number().int().min(1).max(20),
  departmentId: uuidSchema,
  description: z.string().trim().max(2000).nullish(),
  id: uuidSchema.optional(),
  isActive: statusBoolSchema.default(true),
  name: z.string().trim().min(2).max(255),
  totalSessions: z.coerce.number().int().min(1).max(200),
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

    return {
      data: { adminId: user.id },
      success: true,
    };
  } catch (error) {
    return {
      error: parseSupabaseError(error),
      success: false,
    };
  }
}

function invalidInput(error: z.ZodError): ActionFailure {
  return {
    error: "Dữ liệu không hợp lệ.",
    issues: error.flatten().fieldErrors as Record<string, string[]>,
    success: false,
  };
}

function revalidateMany(paths: string[]) {
  paths.forEach((path) => revalidatePath(path));
  [
    "academic-classes",
    "departments",
    "majors",
    "rooms",
    "semesters",
  ].forEach((tag) => revalidateTag(tag, "max"));
}

export async function upsertDepartment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const payload = {
    code: parsed.data.code.toUpperCase(),
    description: parsed.data.description?.trim() || null,
    is_active: parsed.data.isActive,
    name: parsed.data.name,
  };

  const supabase = createAdminClient();

  try {
    if (parsed.data.id) {
      const { error } = await supabase
        .from("departments")
        .update(payload as never)
        .eq("id", parsed.data.id);

      if (error) {
        return {
          error: parseSupabaseError(error),
          success: false,
        };
      }

      revalidateMany(["/admin/departments", "/admin/majors", "/admin/courses"]);
      return {
        data: { id: parsed.data.id },
        message: "Cập nhật khoa thành công.",
        success: true,
      };
    }

    const { data, error } = await supabase
      .from("departments")
      .insert(payload as never)
      .select("id")
      .single();
    const inserted = data as { id: string } | null;

    if (error || !inserted?.id) {
      return {
        error: parseSupabaseError(error, "Không thể tạo khoa mới."),
        success: false,
      };
    }

    revalidateMany(["/admin/departments", "/admin/majors", "/admin/courses"]);
    return {
      data: { id: inserted.id },
      message: "Tạo khoa thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      error: "Mã khoa không hợp lệ.",
      success: false,
    };
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase.from("departments").delete().eq("id", parsedId.data);

    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidateMany(["/admin/departments", "/admin/majors", "/admin/courses"]);
    return { data: undefined, message: "Xóa khoa thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function upsertMajor(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = majorSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const payload = {
    code: parsed.data.code.toUpperCase(),
    degree_level: parsed.data.degreeLevel,
    department_id: parsed.data.departmentId,
    is_active: parsed.data.isActive,
    name: parsed.data.name,
  };

  const supabase = createAdminClient();

  try {
    if (parsed.data.id) {
      const { error } = await supabase
        .from("majors")
        .update(payload as never)
        .eq("id", parsed.data.id);

      if (error) {
        return { error: parseSupabaseError(error), success: false };
      }

      revalidateMany(["/admin/majors", "/admin/classes"]);
      return {
        data: { id: parsed.data.id },
        message: "Cập nhật ngành thành công.",
        success: true,
      };
    }

    const { data, error } = await supabase
      .from("majors")
      .insert(payload as never)
      .select("id")
      .single();
    const inserted = data as { id: string } | null;

    if (error || !inserted?.id) {
      return {
        error: parseSupabaseError(error, "Không thể tạo ngành mới."),
        success: false,
      };
    }

    revalidateMany(["/admin/majors", "/admin/classes"]);
    return {
      data: { id: inserted.id },
      message: "Tạo ngành thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function deleteMajor(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Mã ngành không hợp lệ.", success: false };
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase.from("majors").delete().eq("id", parsedId.data);
    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidateMany(["/admin/majors", "/admin/classes"]);
    return { data: undefined, message: "Xóa ngành thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function upsertClass(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = classSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const payload = {
    code: parsed.data.code.toUpperCase(),
    cohort_year: parsed.data.cohortYear,
    is_active: parsed.data.isActive,
    major_id: parsed.data.majorId,
    name: parsed.data.name,
  };

  const supabase = createAdminClient();
  try {
    if (parsed.data.id) {
      const { error } = await supabase
        .from("academic_classes")
        .update(payload as never)
        .eq("id", parsed.data.id);

      if (error) {
        return { error: parseSupabaseError(error), success: false };
      }

      revalidateMany(["/admin/classes", "/admin/students"]);
      return {
        data: { id: parsed.data.id },
        message: "Cập nhật lớp sinh hoạt thành công.",
        success: true,
      };
    }

    const { data, error } = await supabase
      .from("academic_classes")
      .insert(payload as never)
      .select("id")
      .single();
    const inserted = data as { id: string } | null;

    if (error || !inserted?.id) {
      return {
        error: parseSupabaseError(error, "Không thể tạo lớp sinh hoạt."),
        success: false,
      };
    }

    revalidateMany(["/admin/classes", "/admin/students"]);
    return {
      data: { id: inserted.id },
      message: "Tạo lớp sinh hoạt thành công.",
      success: true,
    };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function deleteClass(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Mã lớp sinh hoạt không hợp lệ.", success: false };
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .from("academic_classes")
      .delete()
      .eq("id", parsedId.data);

    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidateMany(["/admin/classes", "/admin/students"]);
    return { data: undefined, message: "Xóa lớp sinh hoạt thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function upsertSemester(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = semesterSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const payload = {
    academic_year: parsed.data.academicYear,
    code: parsed.data.code.toUpperCase(),
    end_date: parsed.data.endDate,
    enrollment_end: parsed.data.enrollmentEnd,
    enrollment_start: parsed.data.enrollmentStart,
    is_current: parsed.data.isCurrent,
    max_credits: parsed.data.maxCredits,
    name: parsed.data.name,
    regrade_close_at: parsed.data.regradeCloseAt || null,
    regrade_open_at: parsed.data.regradeOpenAt || null,
    start_date: parsed.data.startDate,
  };

  const supabase = createAdminClient();
  try {
    if (parsed.data.id) {
      const { error } = await supabase
        .from("semesters")
        .update(payload as never)
        .eq("id", parsed.data.id);

      if (error) {
        return { error: parseSupabaseError(error), success: false };
      }

      revalidateMany(["/admin/semesters", "/admin/offerings"]);
      return {
        data: { id: parsed.data.id },
        message: "Cập nhật học kỳ thành công.",
        success: true,
      };
    }

    const { data, error } = await supabase
      .from("semesters")
      .insert(payload as never)
      .select("id")
      .single();
    const inserted = data as { id: string } | null;

    if (error || !inserted?.id) {
      return {
        error: parseSupabaseError(error, "Không thể tạo học kỳ."),
        success: false,
      };
    }

    revalidateMany(["/admin/semesters", "/admin/offerings"]);
    return { data: { id: inserted.id }, message: "Tạo học kỳ thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function deleteSemester(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Mã học kỳ không hợp lệ.", success: false };
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase.from("semesters").delete().eq("id", parsedId.data);
    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidateMany(["/admin/semesters", "/admin/offerings"]);
    return { data: undefined, message: "Xóa học kỳ thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function upsertRoom(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const payload = {
    building: parsed.data.building?.trim() || null,
    capacity: parsed.data.capacity,
    code: parsed.data.code.toUpperCase(),
    is_active: parsed.data.isActive,
    name: parsed.data.name,
  };

  const supabase = createAdminClient();
  try {
    if (parsed.data.id) {
      const { error } = await supabase
        .from("rooms")
        .update(payload as never)
        .eq("id", parsed.data.id);

      if (error) {
        return { error: parseSupabaseError(error), success: false };
      }

      revalidateMany(["/admin/rooms", "/admin/schedules"]);
      return { data: { id: parsed.data.id }, message: "Cập nhật phòng học thành công.", success: true };
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert(payload as never)
      .select("id")
      .single();
    const inserted = data as { id: string } | null;

    if (error || !inserted?.id) {
      return { error: parseSupabaseError(error, "Không thể tạo phòng học."), success: false };
    }

    revalidateMany(["/admin/rooms", "/admin/schedules"]);
    return { data: { id: inserted.id }, message: "Tạo phòng học thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Mã phòng học không hợp lệ.", success: false };
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase.from("rooms").delete().eq("id", parsedId.data);
    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidateMany(["/admin/rooms", "/admin/schedules"]);
    return { data: undefined, message: "Xóa phòng học thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function upsertSubject(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const payload = {
    code: parsed.data.code.toUpperCase(),
    credit_hours: parsed.data.creditHours,
    department_id: parsed.data.departmentId,
    description: parsed.data.description?.trim() || null,
    is_active: parsed.data.isActive,
    name: parsed.data.name,
    total_sessions: parsed.data.totalSessions,
  };

  const supabase = createAdminClient();
  try {
    if (parsed.data.id) {
      const { error } = await supabase
        .from("courses")
        .update(payload as never)
        .eq("id", parsed.data.id);

      if (error) {
        return { error: parseSupabaseError(error), success: false };
      }

      revalidateMany(["/admin/courses", "/admin/offerings"]);
      return { data: { id: parsed.data.id }, message: "Cập nhật môn học thành công.", success: true };
    }

    const { data, error } = await supabase
      .from("courses")
      .insert(payload as never)
      .select("id")
      .single();
    const inserted = data as { id: string } | null;

    if (error || !inserted?.id) {
      return { error: parseSupabaseError(error, "Không thể tạo môn học."), success: false };
    }

    revalidateMany(["/admin/courses", "/admin/offerings"]);
    return { data: { id: inserted.id }, message: "Tạo môn học thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.success) {
    return guard;
  }

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Mã môn học không hợp lệ.", success: false };
  }

  const supabase = createAdminClient();
  try {
    const { error } = await supabase.from("courses").delete().eq("id", parsedId.data);
    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidateMany(["/admin/courses", "/admin/offerings"]);
    return { data: undefined, message: "Xóa môn học thành công.", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}
