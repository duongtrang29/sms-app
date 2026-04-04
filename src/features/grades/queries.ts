import { createClient } from "@/lib/supabase/server";

import { requireLecturerOfferingAccess } from "@/lib/auth/guards";
import { requireRole } from "@/lib/auth/session";
import type { CourseOffering, Enrollment, Grade } from "@/types/app";

type GradebookSnapshot = {
  course: {
    code: string;
    name: string;
  } | null;
  grades: Grade[];
  enrollments: Enrollment[];
  offering: {
    id: string;
    section_code: string;
  } | null;
  profiles: Record<string, string>;
  students: Array<{ id: string; student_code: string }>;
};

export async function listStudentGrades() {
  const profile = await requireRole(["STUDENT"]);
  const supabase = await createClient();
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", profile.id)
    .neq("status", "DROPPED");

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const enrollmentIds = ((enrollments as Enrollment[]) ?? []).map(
    (enrollment) => enrollment.id,
  );

  if (!enrollmentIds.length) {
    return [] as Grade[];
  }

  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .in("enrollment_id", enrollmentIds as never);

  if (error) {
    throw new Error(error.message);
  }

  return data as Grade[];
}

export async function listOfferingGradebook(offeringId: string) {
  await requireRole(["LECTURER"]);
  await requireLecturerOfferingAccess(offeringId);
  const supabase = await createClient();

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("*")
    .eq("course_offering_id", offeringId)
    .neq("status", "DROPPED");

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const { data: offering, error: offeringError } = await supabase
    .from("course_offerings")
    .select("id, course_id, section_code")
    .eq("id", offeringId)
    .maybeSingle();

  if (offeringError) {
    throw new Error(offeringError.message);
  }

  const courseId = (offering as { course_id: string } | null)?.course_id ?? null;
  const { data: course, error: courseError } = courseId
    ? await supabase
        .from("courses")
        .select("code, name")
        .eq("id", courseId)
        .maybeSingle()
    : { data: null, error: null };

  if (courseError) {
    throw new Error(courseError.message);
  }

  const studentIds = ((enrollments as Enrollment[]) ?? []).map(
    (enrollment) => enrollment.student_id,
  );
  const enrollmentIds = ((enrollments as Enrollment[]) ?? []).map(
    (enrollment) => enrollment.id,
  );

  const [{ data: students }, { data: grades }, { data: profiles }] = await Promise.all([
    supabase.from("students").select("*").in("id", studentIds as never),
    supabase.from("grades").select("*").in("enrollment_id", enrollmentIds as never),
    supabase.from("profiles").select("id, full_name").in("id", studentIds as never),
  ]);

  return {
    course: (course as { code: string; name: string } | null) ?? null,
    enrollments: (enrollments as Enrollment[]) ?? [],
    grades: (grades as Grade[]) ?? [],
    offering:
      (offering as { id: string; section_code: string } | null) ?? null,
    profiles:
      ((profiles as Array<{ full_name: string; id: string }>) ?? []).reduce<
        Record<string, string>
      >((accumulator, item) => {
        accumulator[item.id] = item.full_name;
        return accumulator;
      }, {}),
    students: (students as Array<{ id: string; student_code: string }>) ?? [],
  } satisfies GradebookSnapshot;
}

export async function listAssignedOfferingsForLecturer() {
  const profile = await requireRole(["LECTURER"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_assignments")
    .select("course_offering_id")
    .eq("lecturer_id", profile.id);

  if (error) {
    throw new Error(error.message);
  }

  const offeringIds = (
    (data as Array<{ course_offering_id: string }>) ?? []
  ).map((item) => item.course_offering_id);

  if (!offeringIds.length) {
    return [] as CourseOffering[];
  }

  const { data: offerings, error: offeringError } = await supabase
    .from("course_offerings")
    .select("*")
    .in("id", offeringIds as never);

  if (offeringError) {
    throw new Error(offeringError.message);
  }

  return offerings as CourseOffering[];
}
