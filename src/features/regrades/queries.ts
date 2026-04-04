import { createClient } from "@/lib/supabase/server";

import { requireRole } from "@/lib/auth/session";
import type { Enrollment, Grade, RegradeRequest } from "@/types/app";

export type RegradeReviewRow = RegradeRequest & {
  course_code: string;
  course_name: string;
  current_total_score: number | null;
  grade_status: Grade["status"] | null;
  reviewer_name: string | null;
  section_code: string;
  semester_code: string;
  student_code: string;
  student_name: string;
};

export async function listStudentRegradeRequests() {
  const profile = await requireRole(["STUDENT"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("regrade_requests")
    .select("*")
    .eq("student_id", profile.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as RegradeRequest[];
}

export async function listLecturerRegradeRequests() {
  const profile = await requireRole(["LECTURER"]);
  const supabase = await createClient();
  const { data: assignments, error: assignmentError } = await supabase
    .from("teaching_assignments")
    .select("course_offering_id")
    .eq("lecturer_id", profile.id);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const offeringIds = (
    (assignments as Array<{ course_offering_id: string }>) ?? []
  ).map((item) => item.course_offering_id);

  if (!offeringIds.length) {
    return [] as RegradeRequest[];
  }

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .in("course_offering_id", offeringIds as never);

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const enrollmentIds = ((enrollments as Array<{ id: string }>) ?? []).map(
    (item) => item.id,
  );

  if (!enrollmentIds.length) {
    return [] as RegradeRequest[];
  }

  const { data, error } = await supabase
    .from("regrade_requests")
    .select("*")
    .in("enrollment_id", enrollmentIds as never)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as RegradeRequest[];
}

async function buildRegradeReviewRows(requests: RegradeRequest[]) {
  if (!requests.length) {
    return [] as RegradeReviewRow[];
  }

  const supabase = await createClient();
  const enrollmentIds = [...new Set(requests.map((request) => request.enrollment_id))];
  const studentIds = [...new Set(requests.map((request) => request.student_id))];
  const reviewerIds = [
    ...new Set(
      requests
        .map((request) => request.reviewed_by)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const gradeIds = [...new Set(requests.map((request) => request.grade_id))];

  const [
    { data: enrollmentsData, error: enrollmentsError },
    { data: studentsData, error: studentsError },
    { data: studentProfilesData, error: studentProfilesError },
    { data: reviewerProfilesData, error: reviewerProfilesError },
    { data: gradesData, error: gradesError },
  ] = await Promise.all([
    supabase.from("enrollments").select("*").in("id", enrollmentIds as never),
    supabase.from("students").select("id, student_code").in("id", studentIds as never),
    supabase.from("profiles").select("id, full_name").in("id", studentIds as never),
    reviewerIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", reviewerIds as never)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("grades").select("*").in("id", gradeIds as never),
  ]);

  const firstErrors = [
    enrollmentsError,
    studentsError,
    studentProfilesError,
    reviewerProfilesError,
    gradesError,
  ].filter(Boolean);

  if (firstErrors.length > 0) {
    throw new Error(firstErrors[0]?.message ?? "Unable to load regrade review data.");
  }

  const enrollments = (enrollmentsData ?? []) as Enrollment[];
  const enrollmentMap = new Map(
    enrollments.map((enrollment) => [enrollment.id, enrollment]),
  );
  const offeringIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.course_offering_id)),
  ];

  const { data: offeringsData, error: offeringsError } = offeringIds.length
    ? await supabase
        .from("course_offerings")
        .select("id, course_id, semester_id, section_code")
        .in("id", offeringIds as never)
    : { data: [], error: null };

  if (offeringsError) {
    throw new Error(offeringsError.message);
  }

  const offeringRows =
    (offeringsData as Array<{
      course_id: string;
      id: string;
      section_code: string;
      semester_id: string;
    }>) ?? [];
  const courseIds = [...new Set(offeringRows.map((offering) => offering.course_id))];
  const semesterIds = [
    ...new Set(offeringRows.map((offering) => offering.semester_id)),
  ];

  const [
    { data: coursesData, error: coursesError },
    { data: semestersData, error: semestersError },
  ] = await Promise.all([
    courseIds.length
      ? supabase.from("courses").select("id, code, name").in("id", courseIds as never)
      : Promise.resolve({ data: [], error: null }),
    semesterIds.length
      ? supabase.from("semesters").select("id, code").in("id", semesterIds as never)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (coursesError || semestersError) {
    throw new Error(coursesError?.message ?? semestersError?.message ?? "Unable to load regrade context.");
  }

  const studentMap = new Map(
    (
      (studentsData as Array<{ id: string; student_code: string }>) ?? []
    ).map((student) => [student.id, student.student_code]),
  );
  const studentProfileMap = new Map(
    (
      (studentProfilesData as Array<{ full_name: string; id: string }>) ?? []
    ).map((profile) => [profile.id, profile.full_name]),
  );
  const reviewerProfileMap = new Map(
    (
      (reviewerProfilesData as Array<{ full_name: string; id: string }>) ?? []
    ).map((profile) => [profile.id, profile.full_name]),
  );
  const gradeMap = new Map(
    ((gradesData ?? []) as Grade[]).map((grade) => [grade.id, grade]),
  );
  const offeringMap = new Map(offeringRows.map((offering) => [offering.id, offering]));
  const courseMap = new Map(
    (
      (coursesData as Array<{ code: string; id: string; name: string }>) ?? []
    ).map((course) => [course.id, course]),
  );
  const semesterMap = new Map(
    ((semestersData as Array<{ code: string; id: string }>) ?? []).map((semester) => [
      semester.id,
      semester.code,
    ]),
  );

  return requests.map((request) => {
    const enrollment = enrollmentMap.get(request.enrollment_id);
    const offering = enrollment
      ? offeringMap.get(enrollment.course_offering_id)
      : undefined;
    const course = offering ? courseMap.get(offering.course_id) : undefined;
    const grade = gradeMap.get(request.grade_id);

    return {
      ...request,
    course_code: course?.code ?? "Chưa có",
    course_name: course?.name ?? "Chưa có",
      current_total_score: grade?.total_score ?? null,
      grade_status: grade?.status ?? null,
      reviewer_name: request.reviewed_by
        ? (reviewerProfileMap.get(request.reviewed_by) ?? null)
        : null,
    section_code: offering?.section_code ?? "Chưa có",
    semester_code: offering ? (semesterMap.get(offering.semester_id) ?? "Chưa có") : "Chưa có",
    student_code: studentMap.get(request.student_id) ?? "Chưa có",
    student_name: studentProfileMap.get(request.student_id) ?? "Chưa có",
    } satisfies RegradeReviewRow;
  });
}

export async function listRegradeReviewRows(scope: "ADMIN" | "LECTURER") {
  if (scope === "ADMIN") {
    await requireRole(["ADMIN"]);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("regrade_requests")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return buildRegradeReviewRows((data ?? []) as RegradeRequest[]);
  }

  const requests = await listLecturerRegradeRequests();
  return buildRegradeReviewRows(requests);
}
