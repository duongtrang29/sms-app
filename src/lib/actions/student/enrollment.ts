"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseSupabaseError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

type EnrollmentResult<T = void> =
  | { data?: T; message?: string; success: true }
  | { error: string; success: false };

const uuidSchema = z.string().uuid();

async function requireStudentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: parseSupabaseError(error, "Chưa đăng nhập"),
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
      error: parseSupabaseError(profileError, "Không thể kiểm tra vai trò người dùng."),
      success: false as const,
      supabase,
    };
  }

  const resolved = profile as { role_code: string; status: string } | null;
  if (!resolved || resolved.role_code !== "STUDENT" || resolved.status !== "ACTIVE") {
    return {
      error: "Bạn không có quyền đăng ký học phần.",
      success: false as const,
      supabase,
    };
  }

  return {
    success: true as const,
    supabase,
    user,
  };
}

export async function registerEnrollment(
  offeringId: string,
): Promise<EnrollmentResult<{ enrollmentId: string }>> {
  const parsedOfferingId = uuidSchema.safeParse(offeringId);
  if (!parsedOfferingId.success) {
    return { error: "Mã học phần mở không hợp lệ.", success: false };
  }

  try {
    const context = await requireStudentUser();
    if (!context.success) {
      return { error: context.error, success: false };
    }

    const rpcRegister = context.supabase.rpc as unknown as (
      fn: "register_enrollment",
      args: { p_offering_id: string },
    ) => Promise<{ data: string | null; error: { message?: string | null } | null }>;
    const { data, error } = await rpcRegister("register_enrollment", {
      p_offering_id: parsedOfferingId.data,
    });

    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidatePath("/student/enrollment");
    revalidatePath("/student/enrollments");
    revalidatePath("/student/timetable");
    revalidatePath("/student/schedule");

    return {
      data: { enrollmentId: data as string },
      message: "Đăng ký thành công",
      success: true,
    };
  } catch (error) {
    return {
      error: parseSupabaseError(error),
      success: false,
    };
  }
}

export async function cancelEnrollment(
  enrollmentId: string,
): Promise<EnrollmentResult> {
  const parsedEnrollmentId = uuidSchema.safeParse(enrollmentId);
  if (!parsedEnrollmentId.success) {
    return { error: "Mã đăng ký không hợp lệ.", success: false };
  }

  try {
    const context = await requireStudentUser();
    if (!context.success) {
      return { error: context.error, success: false };
    }

    const rpcCancel = context.supabase.rpc as unknown as (
      fn: "cancel_enrollment",
      args: { p_enrollment_id: string; p_reason: string | null },
    ) => Promise<{ error: { message?: string | null } | null }>;
    const { error } = await rpcCancel("cancel_enrollment", {
      p_enrollment_id: parsedEnrollmentId.data,
      p_reason: null,
    });

    if (error) {
      return { error: parseSupabaseError(error), success: false };
    }

    revalidatePath("/student/enrollment");
    revalidatePath("/student/enrollments");
    revalidatePath("/student/timetable");
    revalidatePath("/student/schedule");

    return { message: "Hủy đăng ký thành công", success: true };
  } catch (error) {
    return { error: parseSupabaseError(error), success: false };
  }
}
