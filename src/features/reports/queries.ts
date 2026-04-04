import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Views } from "@/types/database";

type StudentDistributionRow = Views<"report_student_distribution">;
type CoursePassRateRow = Views<"report_course_pass_rate">;
type ClassGpaAverageRow = Views<"report_class_gpa_average">;
type AcademicWarningRow = Views<"report_academic_warnings">;

export type ReportSummary = {
  activeStudents: number;
  activeWarnings: number;
  demoRows: number;
  liveRows: number;
  openOfferings: number;
  pendingRegrades: number;
  submittedGrades: number;
  totalLecturers: number;
};

export type DepartmentDistributionPoint = {
  department_name: string;
  total_students: number;
};

export type CoursePassRatePoint = {
  course_code: string;
  course_name: string;
  pass_rate: number;
  total_completed: number;
};

export type ClassGpaPoint = {
  average_gpa4: number;
  average_score10: number;
  class_code: string;
  semester_name: string;
};

export type AcademicWarningPoint = {
  class_code: string;
  completed_credits: number;
  cumulative_gpa4: number;
  cumulative_score10: number;
  student_code: string;
  student_id: string;
  student_name: string;
};

export type AdminReportSnapshot = {
  classGpa: ClassGpaPoint[];
  departmentDistribution: DepartmentDistributionPoint[];
  passRates: CoursePassRatePoint[];
  summary: ReportSummary;
  warnings: AcademicWarningPoint[];
};

function toRoundedNumber(value: number | null | undefined) {
  return Number((value ?? 0).toFixed(2));
}

export async function getAdminReportSnapshot() {
  await requireRole(["ADMIN"]);
  const supabase = await createClient();

  const [
    { count: activeStudentsCount, error: activeStudentsError },
    { count: totalLecturersCount, error: totalLecturersError },
    { count: openOfferingsCount, error: openOfferingsError },
    { count: pendingRegradesCount, error: pendingRegradesError },
    { count: submittedGradesCount, error: submittedGradesError },
    { count: demoRowsCount, error: demoRowsError },
    { count: liveRowsCount, error: liveRowsError },
    { data: studentDistribution, error: studentDistributionError },
    { data: coursePassRates, error: coursePassRatesError },
    { data: classGpas, error: classGpasError },
    { data: academicWarnings, error: academicWarningsError },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .neq("current_status", "DROPPED"),
    supabase.from("lecturers").select("*", { count: "exact", head: true }),
    supabase
      .from("course_offerings")
      .select("*", { count: "exact", head: true })
      .eq("status", "OPEN"),
    supabase
      .from("regrade_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["PENDING", "UNDER_REVIEW"] as never),
    supabase
      .from("grades")
      .select("*", { count: "exact", head: true })
      .eq("status", "SUBMITTED"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_demo", true),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_demo", false),
    supabase
      .from("report_student_distribution")
      .select("*")
      .order("total_students", { ascending: false }),
    supabase
      .from("report_course_pass_rate")
      .select("*")
      .order("total_completed", { ascending: false }),
    supabase
      .from("report_class_gpa_average")
      .select("*")
      .order("average_gpa4", { ascending: false }),
    supabase
      .from("report_academic_warnings")
      .select("*")
      .order("cumulative_gpa4", { ascending: true }),
  ]);

  const errors = [
    activeStudentsError,
    totalLecturersError,
    openOfferingsError,
    pendingRegradesError,
    submittedGradesError,
    demoRowsError,
    liveRowsError,
    studentDistributionError,
    coursePassRatesError,
    classGpasError,
    academicWarningsError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Unable to load admin reports.");
  }

  const distributionRows = (studentDistribution ?? []) as StudentDistributionRow[];
  const passRateRows = (coursePassRates ?? []) as CoursePassRateRow[];
  const classGpaRows = (classGpas ?? []) as ClassGpaAverageRow[];
  const warningRows = (academicWarnings ?? []) as AcademicWarningRow[];

  const departmentDistribution = Object.values(
    distributionRows.reduce<Record<string, DepartmentDistributionPoint>>(
      (accumulator, row) => {
        const key = row.department_name ?? "Chưa phân loại";
        const existing = accumulator[key];

        if (existing) {
          existing.total_students += row.total_students ?? 0;
        } else {
          accumulator[key] = {
            department_name: key,
            total_students: row.total_students ?? 0,
          };
        }

        return accumulator;
      },
      {},
    ),
  )
    .sort((left, right) => right.total_students - left.total_students)
    .slice(0, 8);

  const passRates = passRateRows
    .filter((row) => (row.total_completed ?? 0) > 0)
    .map((row) => ({
    course_code: row.course_code ?? "Chưa có",
    course_name: row.course_name ?? "Chưa có",
      pass_rate: toRoundedNumber(row.pass_rate),
      total_completed: row.total_completed ?? 0,
    }))
    .slice(0, 8);

  const classGpa = classGpaRows
    .filter((row) => row.class_code && row.semester_name)
    .map((row) => ({
      average_gpa4: toRoundedNumber(row.average_gpa4),
      average_score10: toRoundedNumber(row.average_score10),
    class_code: row.class_code ?? "Chưa có",
    semester_name: row.semester_name ?? "Chưa có",
    }))
    .slice(0, 8);

  const warnings = warningRows.map((row) => ({
    class_code: row.class_code ?? "Chưa có",
    completed_credits: row.completed_credits ?? 0,
    cumulative_gpa4: toRoundedNumber(row.cumulative_gpa4),
    cumulative_score10: toRoundedNumber(row.cumulative_score10),
    student_code: row.student_code ?? "Chưa có",
    student_id: row.student_id ?? "",
    student_name: row.student_name ?? "Chưa có",
  }));

  return {
    classGpa,
    departmentDistribution,
    passRates,
    summary: {
      activeStudents: activeStudentsCount ?? 0,
      activeWarnings: warnings.length,
      demoRows: demoRowsCount ?? 0,
      liveRows: liveRowsCount ?? 0,
      openOfferings: openOfferingsCount ?? 0,
      pendingRegrades: pendingRegradesCount ?? 0,
      submittedGrades: submittedGradesCount ?? 0,
      totalLecturers: totalLecturersCount ?? 0,
    },
    warnings,
  } satisfies AdminReportSnapshot;
}
