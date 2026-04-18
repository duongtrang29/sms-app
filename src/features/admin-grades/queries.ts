import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Enrollment, Grade, GradeStatus } from "@/types/app";

const FALLBACK_LABEL = "Chưa có";

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

type OfferingLookupRow = {
  course: { code: string; name: string } | Array<{ code: string; name: string }>;
  id: string;
  section_code: string;
  semester: { code: string } | Array<{ code: string }>;
};

type LookupTables = {
  courseOfferingById: Map<string, OfferingLookupRow>;
  studentCodeById: Map<string, string>;
  studentNameById: Map<string, string>;
};

type BuildGradeRowContext = {
  enrollmentById: Map<string, Enrollment>;
  lookupTables: LookupTables;
};

function createEmptySummary(): Record<AdminGradeFilter, number> {
  return {
    ALL: 0,
    APPROVED: 0,
    DRAFT: 0,
    LOCKED: 0,
    SUBMITTED: 0,
  };
}

function normalizeRelation<T>(
  relation: T | T[] | null | undefined,
): T | undefined {
  if (Array.isArray(relation)) {
    return relation[0];
  }
  return relation ?? undefined;
}

function buildSummary(grades: Grade[]): Record<AdminGradeFilter, number> {
  const summaryByFilter = createEmptySummary();

  for (const grade of grades) {
    summaryByFilter.ALL += 1;
    summaryByFilter[grade.status] += 1;
  }

  return summaryByFilter;
}

function mapEnrollmentsById(enrollments: Enrollment[]) {
  return new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
}

function toUniqueEnrollmentIds(grades: Grade[]) {
  return [...new Set(grades.map((grade) => grade.enrollment_id))];
}

function toUniqueStudentIds(enrollments: Enrollment[]) {
  return [...new Set(enrollments.map((enrollment) => enrollment.student_id))];
}

function toUniqueOfferingIds(enrollments: Enrollment[]) {
  return [
    ...new Set(
      enrollments.map((enrollment) => enrollment.course_offering_id),
    ),
  ];
}

function buildGradeRows(
  grades: Grade[],
  enrollmentById: Map<string, Enrollment>,
  lookupTables: LookupTables,
): AdminGradeReviewRow[] {
  const gradeRowContext: BuildGradeRowContext = {
    enrollmentById,
    lookupTables,
  };
  return grades.map((grade) => buildGradeRow(grade, gradeRowContext));
}

function buildGradeRow(
  grade: Grade,
  gradeRowContext: BuildGradeRowContext,
): AdminGradeReviewRow {
  const enrollment = gradeRowContext.enrollmentById.get(grade.enrollment_id);
  const offering = enrollment
    ? gradeRowContext.lookupTables.courseOfferingById.get(
        enrollment.course_offering_id,
      )
    : undefined;
  const { courseCode, courseName, sectionCode, semesterCode } =
    resolveOfferingDetails(offering);
  const studentLabels = resolveStudentLabels(
    enrollment?.student_id,
    gradeRowContext.lookupTables,
  );

  return {
    attendance_score: grade.attendance_score,
    course_code: courseCode,
    course_name: courseName,
    enrollment_id: grade.enrollment_id,
    final_score: grade.final_score,
    gpa_value: grade.gpa_value,
    grade_id: grade.id,
    letter_grade: grade.letter_grade,
    midterm_score: grade.midterm_score,
    offering_id: enrollment?.course_offering_id ?? "",
    remark: grade.remark,
    section_code: sectionCode,
    semester_code: semesterCode,
    status: grade.status,
    student_code: studentLabels.code,
    student_name: studentLabels.name,
    total_score: grade.total_score,
    updated_at: grade.updated_at,
  };
}

function resolveOfferingDetails(offering: OfferingLookupRow | undefined) {
  const course = normalizeRelation(offering?.course);
  const semester = normalizeRelation(offering?.semester);

  return {
    courseCode: course?.code ?? FALLBACK_LABEL,
    courseName: course?.name ?? FALLBACK_LABEL,
    sectionCode: offering?.section_code ?? FALLBACK_LABEL,
    semesterCode: semester?.code ?? FALLBACK_LABEL,
  };
}

function resolveStudentLabels(
  studentId: string | undefined,
  lookupTables: LookupTables,
) {
  if (!studentId) {
    return {
      code: FALLBACK_LABEL,
      name: FALLBACK_LABEL,
    };
  }

  return {
    code: lookupTables.studentCodeById.get(studentId) ?? FALLBACK_LABEL,
    name: lookupTables.studentNameById.get(studentId) ?? FALLBACK_LABEL,
  };
}

function buildOfferingSummaries(
  grades: Grade[],
  enrollmentById: Map<string, Enrollment>,
  courseOfferingById: Map<string, OfferingLookupRow>,
) {
  const summaryByOffering = new Map<string, AdminOfferingGradeSummary>();

  for (const grade of grades) {
    const offeringSummary = resolveOfferingSummary({
      courseOfferingById,
      enrollmentById,
      enrollmentId: grade.enrollment_id,
      summaryByOffering,
    });

    if (!offeringSummary) {
      continue;
    }

    incrementSummaryByGradeStatus(offeringSummary, grade.status);
  }

  return [...summaryByOffering.values()].sort((left, right) => {
    if (right.submitted_count !== left.submitted_count) {
      return right.submitted_count - left.submitted_count;
    }
    if (right.approved_count !== left.approved_count) {
      return right.approved_count - left.approved_count;
    }
    return right.total_count - left.total_count;
  });
}

function incrementSummaryByGradeStatus(
  offeringSummary: AdminOfferingGradeSummary,
  gradeStatus: GradeStatus,
) {
  offeringSummary.total_count += 1;
  if (gradeStatus === "SUBMITTED") {
    offeringSummary.submitted_count += 1;
  }
  if (gradeStatus === "APPROVED") {
    offeringSummary.approved_count += 1;
  }
  if (gradeStatus === "LOCKED") {
    offeringSummary.locked_count += 1;
  }
}

function resolveOfferingSummary({
  courseOfferingById,
  enrollmentById,
  enrollmentId,
  summaryByOffering,
}: {
  courseOfferingById: Map<string, OfferingLookupRow>;
  enrollmentById: Map<string, Enrollment>;
  enrollmentId: string;
  summaryByOffering: Map<string, AdminOfferingGradeSummary>;
}) {
  const enrollment = enrollmentById.get(enrollmentId);
  if (!enrollment) {
    return null;
  }

  const offering = courseOfferingById.get(enrollment.course_offering_id);
  if (!offering) {
    return null;
  }

  const existingSummary = summaryByOffering.get(offering.id);
  if (existingSummary) {
    return existingSummary;
  }

  const nextSummary = createOfferingSummary(offering);
  summaryByOffering.set(offering.id, nextSummary);
  return nextSummary;
}

function createOfferingSummary(
  offering: OfferingLookupRow,
): AdminOfferingGradeSummary {
  const course = normalizeRelation(offering.course);
  const semester = normalizeRelation(offering.semester);

  return {
    approved_count: 0,
    course_code: course?.code ?? FALLBACK_LABEL,
    course_name: course?.name ?? FALLBACK_LABEL,
    locked_count: 0,
    offering_id: offering.id,
    section_code: offering.section_code,
    semester_code: semester?.code ?? FALLBACK_LABEL,
    submitted_count: 0,
    total_count: 0,
  };
}

async function fetchEnrollmentsByIds(enrollmentIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .in("id", enrollmentIds as never);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Enrollment[];
}

async function fetchLookupTables(
  studentIds: string[],
  offeringIds: string[],
): Promise<LookupTables> {
  const supabase = await createClient();

  const [
    { data: studentsData, error: studentsError },
    { data: profilesData, error: profilesError },
    { data: offeringsData, error: offeringsError },
  ] = await Promise.all([
    queryStudentsByIds(supabase, studentIds),
    queryProfileNamesByIds(supabase, studentIds),
    queryOfferingsByIds(supabase, offeringIds),
  ]);

  const firstLookupError = [studentsError, profilesError, offeringsError].find(
    Boolean,
  );
  if (firstLookupError) {
    throw new Error(
      firstLookupError.message ?? "Unable to load grade review lookup tables.",
    );
  }

  return buildLookupTables({
    offeringsData: (offeringsData ?? []) as OfferingLookupRow[],
    profilesData: (profilesData ?? []) as Array<{ full_name: string; id: string }>,
    studentsData: (studentsData ?? []) as Array<{ id: string; student_code: string }>,
  });
}

function buildLookupTables({
  offeringsData,
  profilesData,
  studentsData,
}: {
  offeringsData: OfferingLookupRow[];
  profilesData: Array<{ full_name: string; id: string }>;
  studentsData: Array<{ id: string; student_code: string }>;
}): LookupTables {
  return {
    courseOfferingById: new Map(
      offeringsData.map((offering) => [offering.id, offering]),
    ),
    studentCodeById: new Map(
      studentsData.map((student) => [student.id, student.student_code]),
    ),
    studentNameById: new Map(
      profilesData.map((profile) => [profile.id, profile.full_name]),
    ),
  };
}

function queryStudentsByIds(supabase: Awaited<ReturnType<typeof createClient>>, studentIds: string[]) {
  if (!studentIds.length) {
    return Promise.resolve({ data: [], error: null });
  }

  return supabase.from("students").select("id, student_code").in("id", studentIds as never);
}

function queryProfileNamesByIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentIds: string[],
) {
  if (!studentIds.length) {
    return Promise.resolve({ data: [], error: null });
  }

  return supabase.from("profiles").select("id, full_name").in("id", studentIds as never);
}

function queryOfferingsByIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offeringIds: string[],
) {
  if (!offeringIds.length) {
    return Promise.resolve({ data: [], error: null });
  }

  return supabase
    .from("course_offerings")
    .select(
      `
        id,
        section_code,
        course:courses!inner(
          code,
          name
        ),
        semester:semesters!inner(
          code
        )
      `,
    )
    .in("id", offeringIds as never);
}

async function fetchAllGrades() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Grade[];
}

/**
 * Returns admin grade review snapshot with row details, summary counters, and offering aggregates.
 * @param filter grade status filter applied to row output.
 * @returns grade review snapshot for admin dashboard.
 */
export async function listAdminGradeReviewSnapshot(
  filter: AdminGradeFilter,
): Promise<AdminGradeReviewSnapshot> {
  await requireRole(["ADMIN"]);

  const grades = await fetchAllGrades();
  const summary = buildSummary(grades);
  const visibleGrades =
    filter === "ALL" ? grades : grades.filter((grade) => grade.status === filter);
  const enrollmentIds = toUniqueEnrollmentIds(grades);

  if (!enrollmentIds.length) {
    return {
      offeringSummaries: [],
      rows: [],
      summary,
    };
  }

  const enrollments = await fetchEnrollmentsByIds(enrollmentIds);
  const enrollmentById = mapEnrollmentsById(enrollments);
  const studentIds = toUniqueStudentIds(enrollments);
  const offeringIds = toUniqueOfferingIds(enrollments);
  const lookupTables = await fetchLookupTables(studentIds, offeringIds);

  return {
    offeringSummaries: buildOfferingSummaries(
      grades,
      enrollmentById,
      lookupTables.courseOfferingById,
    ),
    rows: buildGradeRows(visibleGrades, enrollmentById, lookupTables),
    summary,
  };
}
