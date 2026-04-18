import { unstable_noStore as noStore } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { GradeStatus } from "@/types/app";

const FALLBACK_LABEL = "Chưa có";

const GRADE_REVIEW_SELECT = `
  id,
  enrollment_id,
  attendance_score,
  midterm_score,
  final_score,
  total_score,
  letter_grade,
  gpa_value,
  remark,
  status,
  updated_at,
  enrollment:enrollments!inner(
    id,
    student_id,
    course_offering_id,
    student:students!inner(
      student_code,
      profile:profiles!inner(
        full_name
      )
    ),
    offering:course_offerings!inner(
      id,
      section_code,
      course:courses!inner(
        code,
        name
      ),
      semester:semesters!inner(
        code
      )
    )
  )
`;

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

type Relation<T> = T | T[] | null | undefined;

type RawGradeReviewRow = {
  attendance_score: number | null;
  enrollment:
    | {
        course_offering_id: string;
        offering:
          | {
              course:
                | {
                    code: string | null;
                    name: string | null;
                  }
                | Array<{
                    code: string | null;
                    name: string | null;
                  }>
                | null;
              id: string;
              section_code: string | null;
              semester:
                | {
                    code: string | null;
                  }
                | Array<{
                    code: string | null;
                  }>
                | null;
            }
          | Array<{
              course:
                | {
                    code: string | null;
                    name: string | null;
                  }
                | Array<{
                    code: string | null;
                    name: string | null;
                  }>
                | null;
              id: string;
              section_code: string | null;
              semester:
                | {
                    code: string | null;
                  }
                | Array<{
                    code: string | null;
                  }>
                | null;
            }>
          | null;
        student:
          | {
              profile:
                | {
                    full_name: string | null;
                  }
                | Array<{
                    full_name: string | null;
                  }>
                | null;
              student_code: string | null;
            }
          | Array<{
              profile:
                | {
                    full_name: string | null;
                  }
                | Array<{
                    full_name: string | null;
                  }>
                | null;
              student_code: string | null;
            }>
          | null;
      }
    | Array<{
        course_offering_id: string;
        offering:
          | {
              course:
                | {
                    code: string | null;
                    name: string | null;
                  }
                | Array<{
                    code: string | null;
                    name: string | null;
                  }>
                | null;
              id: string;
              section_code: string | null;
              semester:
                | {
                    code: string | null;
                  }
                | Array<{
                    code: string | null;
                  }>
                | null;
            }
          | Array<{
              course:
                | {
                    code: string | null;
                    name: string | null;
                  }
                | Array<{
                    code: string | null;
                    name: string | null;
                  }>
                | null;
              id: string;
              section_code: string | null;
              semester:
                | {
                    code: string | null;
                  }
                | Array<{
                    code: string | null;
                  }>
                | null;
            }>
          | null;
        student:
          | {
              profile:
                | {
                    full_name: string | null;
                  }
                | Array<{
                    full_name: string | null;
                  }>
                | null;
              student_code: string | null;
            }
          | Array<{
              profile:
                | {
                    full_name: string | null;
                  }
                | Array<{
                    full_name: string | null;
                  }>
                | null;
              student_code: string | null;
            }>
          | null;
      }>
    | null;
  enrollment_id: string;
  final_score: number | null;
  gpa_value: number | null;
  id: string;
  letter_grade: string | null;
  midterm_score: number | null;
  remark: string | null;
  status: GradeStatus;
  total_score: number | null;
  updated_at: string;
};

function normalizeRelation<T>(relation: Relation<T>): T | undefined {
  if (Array.isArray(relation)) {
    return relation[0];
  }

  return relation ?? undefined;
}

function createEmptySummary(): Record<AdminGradeFilter, number> {
  return {
    ALL: 0,
    APPROVED: 0,
    DRAFT: 0,
    LOCKED: 0,
    SUBMITTED: 0,
  };
}

function buildSummary(rows: AdminGradeReviewRow[]): Record<AdminGradeFilter, number> {
  const summary = createEmptySummary();

  for (const row of rows) {
    summary.ALL += 1;
    summary[row.status] += 1;
  }

  return summary;
}

function mapRawGradeRow(row: RawGradeReviewRow): AdminGradeReviewRow {
  const enrollment = normalizeRelation(row.enrollment);
  const offering = normalizeRelation(enrollment?.offering);
  const course = normalizeRelation(offering?.course);
  const semester = normalizeRelation(offering?.semester);
  const student = normalizeRelation(enrollment?.student);
  const profile = normalizeRelation(student?.profile);

  return {
    attendance_score: row.attendance_score,
    course_code: course?.code ?? FALLBACK_LABEL,
    course_name: course?.name ?? FALLBACK_LABEL,
    enrollment_id: row.enrollment_id,
    final_score: row.final_score,
    gpa_value: row.gpa_value,
    grade_id: row.id,
    letter_grade: row.letter_grade,
    midterm_score: row.midterm_score,
    offering_id: offering?.id ?? enrollment?.course_offering_id ?? "",
    remark: row.remark,
    section_code: offering?.section_code ?? FALLBACK_LABEL,
    semester_code: semester?.code ?? FALLBACK_LABEL,
    status: row.status,
    student_code: student?.student_code ?? FALLBACK_LABEL,
    student_name: profile?.full_name ?? FALLBACK_LABEL,
    total_score: row.total_score,
    updated_at: row.updated_at,
  };
}

function buildOfferingSummaries(rows: AdminGradeReviewRow[]) {
  const summaryByOffering = new Map<string, AdminOfferingGradeSummary>();

  for (const row of rows) {
    if (!row.offering_id) {
      continue;
    }

    const existingSummary = summaryByOffering.get(row.offering_id);
    const offeringSummary = existingSummary ?? {
      approved_count: 0,
      course_code: row.course_code,
      course_name: row.course_name,
      locked_count: 0,
      offering_id: row.offering_id,
      section_code: row.section_code,
      semester_code: row.semester_code,
      submitted_count: 0,
      total_count: 0,
    };

    offeringSummary.total_count += 1;
    if (row.status === "SUBMITTED") {
      offeringSummary.submitted_count += 1;
    }
    if (row.status === "APPROVED") {
      offeringSummary.approved_count += 1;
    }
    if (row.status === "LOCKED") {
      offeringSummary.locked_count += 1;
    }

    summaryByOffering.set(row.offering_id, offeringSummary);
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

async function fetchGradeReviewRows() {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("grades")
    .select(GRADE_REVIEW_SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawGradeReviewRow[]).map(mapRawGradeRow);
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

  const rows = await fetchGradeReviewRows();
  const summary = buildSummary(rows);
  const visibleRows =
    filter === "ALL" ? rows : rows.filter((row) => row.status === filter);

  return {
    offeringSummaries: buildOfferingSummaries(rows),
    rows: visibleRows,
    summary,
  };
}
