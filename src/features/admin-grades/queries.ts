import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Enrollment, Grade, GradeStatus } from "@/types/app";

export type AdminGradeFilter = GradeStatus | "ALL";

export type AdminGradeReviewRow = {
  attendance_score: number | null;
  course_code: string;
  course_name: string;
  enrollment_id: string;
  final_score: number | null;
  gpa_value: number | null;
  grade_id: string;
  letter_grade: string | null;
  midterm_score: number | null;
  offering_id: string;
  remark: string | null;
  section_code: string;
  semester_code: string;
  status: GradeStatus;
  student_code: string;
  student_name: string;
  total_score: number | null;
  updated_at: string;
};

export type AdminOfferingGradeSummary = {
  approved_count: number;
  course_code: string;
  course_name: string;
  locked_count: number;
  offering_id: string;
  section_code: string;
  semester_code: string;
  submitted_count: number;
  total_count: number;
};

export type AdminGradeReviewSnapshot = {
  offeringSummaries: AdminOfferingGradeSummary[];
  rows: AdminGradeReviewRow[];
  summary: Record<AdminGradeFilter, number>;
};

function emptySummary() {
  return {
    ALL: 0,
    APPROVED: 0,
    DRAFT: 0,
    LOCKED: 0,
    SUBMITTED: 0,
  } satisfies Record<AdminGradeFilter, number>;
}

export async function listAdminGradeReviewSnapshot(filter: AdminGradeFilter) {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const { data: gradesData, error: gradesError } = await supabase
    .from("grades")
    .select("*")
    .order("updated_at", { ascending: false });

  if (gradesError) {
    throw new Error(gradesError.message);
  }

  const grades = (gradesData ?? []) as Grade[];
  const summary = grades.reduce<Record<AdminGradeFilter, number>>(
    (accumulator, grade) => {
      accumulator.ALL += 1;
      accumulator[grade.status] += 1;
      return accumulator;
    },
    emptySummary(),
  );

  const visibleGrades =
    filter === "ALL" ? grades : grades.filter((grade) => grade.status === filter);
  const enrollmentIds = [...new Set(grades.map((grade) => grade.enrollment_id))];

  if (!enrollmentIds.length) {
    return {
      offeringSummaries: [],
      rows: [],
      summary,
    } satisfies AdminGradeReviewSnapshot;
  }

  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("*")
    .in("id", enrollmentIds as never);

  if (enrollmentsError) {
    throw new Error(enrollmentsError.message);
  }

  const enrollments = (enrollmentsData ?? []) as Enrollment[];
  const enrollmentMap = new Map(
    enrollments.map((enrollment) => [enrollment.id, enrollment]),
  );
  const studentIds = [...new Set(enrollments.map((enrollment) => enrollment.student_id))];
  const offeringIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.course_offering_id)),
  ];

  const [
    { data: studentsData, error: studentsError },
    { data: profilesData, error: profilesError },
    { data: offeringsData, error: offeringsError },
  ] = await Promise.all([
    studentIds.length
      ? supabase.from("students").select("id, student_code").in("id", studentIds as never)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", studentIds as never)
      : Promise.resolve({ data: [], error: null }),
    offeringIds.length
      ? supabase
          .from("course_offerings")
          .select("id, course_id, semester_id, section_code")
          .in("id", offeringIds as never)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const lookupErrors = [studentsError, profilesError, offeringsError].filter(Boolean);

  if (lookupErrors.length > 0) {
    throw new Error(lookupErrors[0]?.message ?? "Unable to load grade review lookup tables.");
  }

  const offeringRows =
    (offeringsData as Array<{
      course_id: string;
      id: string;
      section_code: string;
      semester_id: string;
    }>) ?? [];

  const courseIds = [...new Set(offeringRows.map((offering) => offering.course_id))];
  const semesterIds = [...new Set(offeringRows.map((offering) => offering.semester_id))];

  const [
    { data: coursesData, error: coursesError },
    { data: semestersData, error: semestersError },
  ] = await Promise.all([
    courseIds.length
      ? supabase.from("courses").select("id, code, name").in("id", courseIds as never)
      : Promise.resolve({ data: [], error: null }),
    semesterIds.length
      ? supabase
          .from("semesters")
          .select("id, code")
          .in("id", semesterIds as never)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const finalLookupErrors = [coursesError, semestersError].filter(Boolean);

  if (finalLookupErrors.length > 0) {
    throw new Error(
      finalLookupErrors[0]?.message ?? "Unable to load grade review metadata.",
    );
  }

  const studentMap = new Map(
    (
      (studentsData as Array<{ id: string; student_code: string }>) ?? []
    ).map((student) => [student.id, student.student_code]),
  );
  const profileMap = new Map(
    (
      (profilesData as Array<{ full_name: string; id: string }>) ?? []
    ).map((profile) => [profile.id, profile.full_name]),
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

  const rows = visibleGrades.map((grade) => {
    const enrollment = enrollmentMap.get(grade.enrollment_id);
    const offering = enrollment
      ? offeringMap.get(enrollment.course_offering_id)
      : undefined;
    const course = offering ? courseMap.get(offering.course_id) : undefined;

    return {
      attendance_score: grade.attendance_score,
    course_code: course?.code ?? "Chưa có",
    course_name: course?.name ?? "Chưa có",
      enrollment_id: grade.enrollment_id,
      final_score: grade.final_score,
      gpa_value: grade.gpa_value,
      grade_id: grade.id,
      letter_grade: grade.letter_grade,
      midterm_score: grade.midterm_score,
      offering_id: enrollment?.course_offering_id ?? "",
      remark: grade.remark,
    section_code: offering?.section_code ?? "Chưa có",
      semester_code: offering
      ? (semesterMap.get(offering.semester_id) ?? "Chưa có")
      : "Chưa có",
      status: grade.status,
      student_code: enrollment
      ? (studentMap.get(enrollment.student_id) ?? "Chưa có")
      : "Chưa có",
      student_name: enrollment
      ? (profileMap.get(enrollment.student_id) ?? "Chưa có")
      : "Chưa có",
      total_score: grade.total_score,
      updated_at: grade.updated_at,
    } satisfies AdminGradeReviewRow;
  });

  const offeringSummaries = Object.values(
    grades.reduce<Record<string, AdminOfferingGradeSummary>>((accumulator, grade) => {
      const enrollment = enrollmentMap.get(grade.enrollment_id);
      const offering = enrollment
        ? offeringMap.get(enrollment.course_offering_id)
        : undefined;

      if (!enrollment || !offering) {
        return accumulator;
      }

      const course = courseMap.get(offering.course_id);
      const key = offering.id;
      const existing = accumulator[key];

      if (!existing) {
        accumulator[key] = {
          approved_count: 0,
    course_code: course?.code ?? "Chưa có",
    course_name: course?.name ?? "Chưa có",
          locked_count: 0,
          offering_id: offering.id,
          section_code: offering.section_code,
    semester_code: semesterMap.get(offering.semester_id) ?? "Chưa có",
          submitted_count: 0,
          total_count: 0,
        };
      }

      const summaryRow = accumulator[key];

      if (!summaryRow) {
        return accumulator;
      }

      summaryRow.total_count += 1;
      if (grade.status === "SUBMITTED") {
        summaryRow.submitted_count += 1;
      }
      if (grade.status === "APPROVED") {
        summaryRow.approved_count += 1;
      }
      if (grade.status === "LOCKED") {
        summaryRow.locked_count += 1;
      }

      return accumulator;
    }, {}),
  ).sort((left, right) => {
    if (right.submitted_count !== left.submitted_count) {
      return right.submitted_count - left.submitted_count;
    }

    if (right.approved_count !== left.approved_count) {
      return right.approved_count - left.approved_count;
    }

    return right.total_count - left.total_count;
  });

  return {
    offeringSummaries,
    rows,
    summary,
  } satisfies AdminGradeReviewSnapshot;
}
