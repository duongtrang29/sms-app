import { redirect } from "next/navigation";

import { getRoleHomePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth/session";
import type { AppRole, AuthenticatedProfile } from "@/types/app";

type EnrollmentScopeRecord = {
  course_offering_id: string;
  id: string;
  student_id: string;
};

type RegradeScopeRecord = {
  enrollment_id: string;
  grade_id: string;
  id: string;
  student_id: string;
};

export async function getProtectedProfile() {
  return requireAuth();
}

export async function getRoleProtectedProfile(roles: AppRole[]) {
  return requireRole(roles);
}

export function redirectToRoleHome(profile: AuthenticatedProfile) {
  redirect(getRoleHomePath(profile.role_code));
}

export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

async function loadEnrollmentScopeRecord(enrollmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, student_id, course_offering_id")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as EnrollmentScopeRecord | null) ?? null;
}

export async function requireLecturerOfferingAccess(offeringId: string) {
  const profile = await requireRole(["LECTURER"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_assignments")
    .select("course_offering_id")
    .eq("course_offering_id", offeringId)
    .eq("lecturer_id", profile.id)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const assignments = (data as Array<{ course_offering_id: string }>) ?? [];

  if (!assignments.length) {
    throw new Error("Bạn không được phân công học phần này.");
  }

  return profile;
}

export async function requireLecturerEnrollmentAccess(
  enrollmentId: string,
  offeringId?: string,
) {
  const profile = await requireRole(["LECTURER"]);
  const enrollment = await loadEnrollmentScopeRecord(enrollmentId);

  if (!enrollment) {
    throw new Error("Không tìm thấy enrollment.");
  }

  if (offeringId && enrollment.course_offering_id !== offeringId) {
    throw new Error("Enrollment không thuộc học phần được gửi lên.");
  }

  await requireLecturerOfferingAccess(enrollment.course_offering_id);

  return {
    enrollment,
    profile,
  };
}

export async function requireStudentEnrollmentOwnership(enrollmentId: string) {
  const profile = await requireRole(["STUDENT"]);
  const enrollment = await loadEnrollmentScopeRecord(enrollmentId);

  if (!enrollment || enrollment.student_id !== profile.id) {
    throw new Error("Bạn không có quyền truy cập enrollment này.");
  }

  return {
    enrollment,
    profile,
  };
}

export async function requireStudentGradeOwnership(
  gradeId: string,
  enrollmentId?: string,
) {
  const profile = await requireRole(["STUDENT"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grades")
    .select("id, enrollment_id")
    .eq("id", gradeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const grade = (data as { enrollment_id: string; id: string } | null) ?? null;

  if (!grade) {
    throw new Error("Không tìm thấy bản ghi điểm.");
  }

  if (enrollmentId && grade.enrollment_id !== enrollmentId) {
    throw new Error("Dữ liệu grade và enrollment không khớp.");
  }

  const { enrollment } = await requireStudentEnrollmentOwnership(grade.enrollment_id);

  return {
    enrollment,
    grade,
    profile,
  };
}

export async function requireRegradeReviewAccess(requestId: string) {
  const profile = await requireRole(["ADMIN", "LECTURER"]);

  if (profile.role_code === "ADMIN") {
    return profile;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("regrade_requests")
    .select("id, enrollment_id, grade_id, student_id")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const request = (data as RegradeScopeRecord | null) ?? null;

  if (!request) {
    throw new Error("Không tìm thấy yêu cầu phúc khảo.");
  }

  await requireLecturerEnrollmentAccess(request.enrollment_id);

  return profile;
}
