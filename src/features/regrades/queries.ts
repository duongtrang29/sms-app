import { createClient } from "@/lib/supabase/server";

import { requireRole } from "@/lib/auth/session";
import type { Enrollment, Grade, RegradeRequest } from "@/types/app";

const FALLBACK_LABEL = "Chưa có";
const EMPTY_REGRADE_ROWS: RegradeReviewRow[] = [];

type OfferingLookupRow = {
  course: { code: string; name: string } | Array<{ code: string; name: string }>;
  id: string;
  section_code: string;
  semester: { code: string } | Array<{ code: string }>;
};

type LookupContext = {
  enrollmentById: Map<string, Enrollment>;
  gradeById: Map<string, Grade>;
  offeringById: Map<string, OfferingLookupRow>;
  reviewerNameById: Map<string, string>;
  studentCodeById: Map<string, string>;
  studentNameById: Map<string, string>;
};

type StudentLookupRow = {
  id: string;
  profile: { full_name: string; id: string } | Array<{ full_name: string; id: string }>;
  student_code: string;
};

type RequestLookupIds = {
  enrollmentIds: string[];
  gradeIds: string[];
  reviewerIds: string[];
  studentIds: string[];
};

type BaseLookupData = {
  enrollmentsData: Enrollment[];
  gradesData: Grade[];
  reviewerProfilesData: Array<{ full_name: string; id: string }>;
  studentsData: StudentLookupRow[];
};

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

function normalizeRelation<T>(
  relation: T | T[] | null | undefined,
): T | undefined {
  if (Array.isArray(relation)) {
    return relation[0];
  }
  return relation ?? undefined;
}

function collectLookupIds(requests: RegradeRequest[]): RequestLookupIds {
  return {
    enrollmentIds: [...new Set(requests.map((request) => request.enrollment_id))],
    gradeIds: [...new Set(requests.map((request) => request.grade_id))],
    reviewerIds: [
      ...new Set(
        requests
          .map((request) => request.reviewed_by)
          .filter((reviewerId): reviewerId is string => Boolean(reviewerId)),
      ),
    ],
    studentIds: [...new Set(requests.map((request) => request.student_id))],
  };
}

function mapStudentRows(studentsData: StudentLookupRow[]) {
  const studentCodeById = new Map<string, string>();
  const studentNameById = new Map<string, string>();

  for (const studentRow of studentsData) {
    studentCodeById.set(studentRow.id, studentRow.student_code);
    const profile = normalizeRelation(studentRow.profile);
    if (profile?.id) {
      studentNameById.set(profile.id, profile.full_name);
    }
  }

  return { studentCodeById, studentNameById };
}

function mapRegradeRow(
  request: RegradeRequest,
  lookupContext: LookupContext,
): RegradeReviewRow {
  const enrollment = lookupContext.enrollmentById.get(request.enrollment_id);
  const offering = enrollment
    ? lookupContext.offeringById.get(enrollment.course_offering_id)
    : undefined;
  const course = normalizeRelation(offering?.course);
  const semester = normalizeRelation(offering?.semester);
  const grade = lookupContext.gradeById.get(request.grade_id);

  return {
    ...request,
    course_code: course?.code ?? FALLBACK_LABEL,
    course_name: course?.name ?? FALLBACK_LABEL,
    current_total_score: grade?.total_score ?? null,
    grade_status: grade?.status ?? null,
    reviewer_name: request.reviewed_by
      ? (lookupContext.reviewerNameById.get(request.reviewed_by) ?? null)
      : null,
    section_code: offering?.section_code ?? FALLBACK_LABEL,
    semester_code: semester?.code ?? FALLBACK_LABEL,
    student_code: lookupContext.studentCodeById.get(request.student_id) ?? FALLBACK_LABEL,
    student_name: lookupContext.studentNameById.get(request.student_id) ?? FALLBACK_LABEL,
  };
}

function assertNoQueryErrors(
  errors: Array<{ message?: string } | null>,
  fallbackMessage: string,
) {
  const firstError = errors.find(Boolean);
  if (firstError) {
    throw new Error(firstError.message ?? fallbackMessage);
  }
}

async function queryRegradeRequestsByStudent(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("regrade_requests")
    .select("*")
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RegradeRequest[];
}

async function queryAssignedOfferingIds(lecturerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_assignments")
    .select("course_offering_id")
    .eq("lecturer_id", lecturerId);

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data as Array<{ course_offering_id: string }>) ?? []
  ).map((assignment) => assignment.course_offering_id);
}

async function queryEnrollmentIdsByOfferingIds(offeringIds: string[]) {
  if (!offeringIds.length) {
    return [] as string[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .in("course_offering_id", offeringIds as never);

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Array<{ id: string }>) ?? []).map((enrollment) => enrollment.id);
}

async function queryRegradeRequestsByEnrollmentIds(enrollmentIds: string[]) {
  if (!enrollmentIds.length) {
    return [] as RegradeRequest[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("regrade_requests")
    .select("*")
    .in("enrollment_id", enrollmentIds as never)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RegradeRequest[];
}

async function queryAdminRegradeRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("regrade_requests")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RegradeRequest[];
}

async function fetchLookupContext(requests: RegradeRequest[]): Promise<LookupContext> {
  const lookupIds = collectLookupIds(requests);
  const baseLookupData = await queryBaseLookupData(lookupIds);
  return mapLookupContext(baseLookupData);
}

async function queryBaseLookupData(lookupIds: RequestLookupIds): Promise<BaseLookupData> {
  const supabase = await createClient();
  const queryResults = await queryBaseLookupSources(supabase, lookupIds);
  const [
    { data: enrollmentsData, error: enrollmentsError },
    { data: studentsData, error: studentsError },
    { data: reviewerProfilesData, error: reviewerProfilesError },
    { data: gradesData, error: gradesError },
  ] = queryResults;

  assertNoQueryErrors(
    [enrollmentsError, studentsError, reviewerProfilesError, gradesError],
    "Unable to load regrade review data.",
  );

  return toBaseLookupData({
    enrollmentsData,
    gradesData,
    reviewerProfilesData,
    studentsData,
  });
}

function queryBaseLookupSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lookupIds: RequestLookupIds,
) {
  return Promise.all([
    supabase.from("enrollments").select("*").in("id", lookupIds.enrollmentIds as never),
    supabase
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
      .in("id", lookupIds.studentIds as never),
    lookupIds.reviewerIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", lookupIds.reviewerIds as never)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("grades").select("*").in("id", lookupIds.gradeIds as never),
  ]);
}

function toBaseLookupData({
  enrollmentsData,
  gradesData,
  reviewerProfilesData,
  studentsData,
}: {
  enrollmentsData: Enrollment[] | null;
  gradesData: Grade[] | null;
  reviewerProfilesData: Array<{ full_name: string; id: string }> | null;
  studentsData: StudentLookupRow[] | null;
}): BaseLookupData {
  return {
    enrollmentsData: (enrollmentsData ?? []) as Enrollment[],
    gradesData: (gradesData ?? []) as Grade[],
    reviewerProfilesData:
      (reviewerProfilesData as Array<{ full_name: string; id: string }>) ?? [],
    studentsData: (studentsData ?? []) as StudentLookupRow[],
  };
}

async function mapLookupContext(baseLookupData: BaseLookupData): Promise<LookupContext> {
  const enrollments = baseLookupData.enrollmentsData;
  const offeringIds = [
    ...new Set(
      enrollments.map((enrollment) => enrollment.course_offering_id),
    ),
  ];

  return {
    enrollmentById: new Map(enrollments.map((enrollment) => [enrollment.id, enrollment])),
    gradeById: new Map(baseLookupData.gradesData.map((grade) => [grade.id, grade])),
    offeringById: await queryOfferingLookupByIds(offeringIds),
    reviewerNameById: new Map(
      baseLookupData.reviewerProfilesData.map((profile) => [profile.id, profile.full_name]),
    ),
    ...mapStudentRows(baseLookupData.studentsData),
  };
}

async function queryOfferingLookupByIds(offeringIds: string[]) {
  if (!offeringIds.length) {
    return new Map<string, OfferingLookupRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
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

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as OfferingLookupRow[]).map((offering) => [offering.id, offering]),
  );
}

async function buildRegradeReviewRows(requests: RegradeRequest[]) {
  if (!requests.length) {
    return EMPTY_REGRADE_ROWS;
  }

  const lookupContext = await fetchLookupContext(requests);
  return requests.map((request) => mapRegradeRow(request, lookupContext));
}

/**
 * Returns regrade requests for the current student.
 * @returns student-owned regrade requests sorted by newest first.
 */
export async function listStudentRegradeRequests() {
  const profile = await requireRole(["STUDENT"]);
  return queryRegradeRequestsByStudent(profile.id);
}

/**
 * Returns regrade requests that belong to offerings assigned to current lecturer.
 * @returns lecturer-visible regrade requests sorted by newest first.
 */
export async function listLecturerRegradeRequests() {
  const profile = await requireRole(["LECTURER"]);
  const offeringIds = await queryAssignedOfferingIds(profile.id);
  const enrollmentIds = await queryEnrollmentIdsByOfferingIds(offeringIds);
  return queryRegradeRequestsByEnrollmentIds(enrollmentIds);
}

/**
 * Returns enriched regrade rows for review screens by scope.
 * @param scope access scope for review rows.
 * @returns regrade rows with student/course/grade lookup fields.
 */
export async function listRegradeReviewRows(scope: "ADMIN" | "LECTURER") {
  if (scope === "ADMIN") {
    await requireRole(["ADMIN"]);
    const requests = await queryAdminRegradeRequests();
    return buildRegradeReviewRows(requests);
  }

  const requests = await listLecturerRegradeRequests();
  return buildRegradeReviewRows(requests);
}
