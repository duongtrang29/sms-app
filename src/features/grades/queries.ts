import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

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
    attendance_weight: number;
    final_weight: number;
    id: string;
    midterm_weight: number;
    section_code: string;
  } | null;
  profiles: Record<string, string>;
  students: Array<{ id: string; student_code: string }>;
};

export async function listStudentGrades() {
  noStore();
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
    .in("enrollment_id", enrollmentIds as never)
    .in("status", ["APPROVED", "LOCKED"] as never);

  if (error) {
    throw new Error(error.message);
  }

  return data as Grade[];
}

export async function listOfferingGradebook(offeringId: string) {
  noStore();
  await requireRole(["LECTURER"]);
  await requireLecturerOfferingAccess(offeringId);
  const supabase = await createClient();

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("*")
    .eq("course_offering_id", offeringId)
    .in("status", ["ENROLLED", "REGISTERED"] as never);

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const { data: offering, error: offeringError } = await supabase
    .from("course_offerings")
    .select(
      `
        attendance_weight,
        final_weight,
        id,
        midterm_weight,
        section_code,
        course:courses!inner(
          code,
          name
        )
      `,
    )
    .eq("id", offeringId)
    .maybeSingle();

  if (offeringError) {
    throw new Error(offeringError.message);
  }

  const studentIds = ((enrollments as Enrollment[]) ?? []).map(
    (enrollment) => enrollment.student_id,
  );
  const enrollmentIds = ((enrollments as Enrollment[]) ?? []).map(
    (enrollment) => enrollment.id,
  );

  const [{ data: studentsData, error: studentsError }, { data: gradesData, error: gradesError }] =
    await Promise.all([
      studentIds.length
        ? supabase
            .from("students")
            .select(
              `
                id,
                student_code,
                profile:profiles!inner(
                  id,
                  full_name
                )
              `,
            )
            .in("id", studentIds as never)
        : Promise.resolve({ data: [], error: null }),
      enrollmentIds.length
        ? supabase.from("grades").select("*").in("enrollment_id", enrollmentIds as never)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const lookupErrors = [studentsError, gradesError].filter(Boolean);
  if (lookupErrors.length > 0) {
    throw new Error(lookupErrors[0]?.message ?? "Unable to load gradebook data.");
  }

  const studentRows = ((studentsData ?? []) as Array<{
    id: string;
    profile: { full_name: string; id: string } | Array<{ full_name: string; id: string }>;
    student_code: string;
  }>).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return {
      id: row.id,
      profile,
      student_code: row.student_code,
    };
  });

  const rawCourse = (offering as {
    course:
      | { code: string; name: string }
      | Array<{ code: string; name: string }>
      | null;
  } | null)?.course;
  const normalizedCourse = Array.isArray(rawCourse)
    ? (rawCourse[0] ?? null)
    : (rawCourse ?? null);

  return {
    course: normalizedCourse,
    enrollments: (enrollments as Enrollment[]) ?? [],
    grades: (gradesData as Grade[]) ?? [],
    offering:
      (offering as {
        attendance_weight: number;
        final_weight: number;
        id: string;
        midterm_weight: number;
        section_code: string;
      } | null) ?? null,
    profiles: studentRows.reduce<Record<string, string>>((accumulator, row) => {
      if (row.profile) {
        accumulator[row.profile.id] = row.profile.full_name;
      }
      return accumulator;
    }, {}),
    students: studentRows.map((row) => ({
      id: row.id,
      student_code: row.student_code,
    })),
  } satisfies GradebookSnapshot;
}

export async function listAssignedOfferingsForLecturer() {
  noStore();
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
