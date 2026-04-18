import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
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

type RequiredReportView =
  | "report_academic_warnings"
  | "report_class_gpa_average"
  | "report_course_pass_rate";

export type AdminReportSnapshot = {
  classGpa: ClassGpaPoint[];
  departmentDistribution: DepartmentDistributionPoint[];
  missingViewSql: string;
  missingViews: RequiredReportView[];
  passRates: CoursePassRatePoint[];
  summary: ReportSummary;
  warnings: AcademicWarningPoint[];
};

const REQUIRED_REPORT_VIEWS: RequiredReportView[] = [
  "report_course_pass_rate",
  "report_class_gpa_average",
  "report_academic_warnings",
];

const REPORT_VIEW_SQL: Record<RequiredReportView, string> = {
  report_course_pass_rate: `
create or replace view public.report_course_pass_rate as
select
  c.id as course_id,
  c.code as course_code,
  c.name as course_name,
  count(g.id)::int as total_completed,
  round(
    100.0 * sum(case when g.total_score >= co.passing_score then 1 else 0 end)
    / nullif(count(g.id), 0),
    2
  ) as pass_rate
from grades g
join enrollments e on e.id = g.enrollment_id
join course_offerings co on co.id = e.course_offering_id
join courses c on c.id = co.course_id
where g.status in ('APPROVED', 'LOCKED')
group by c.id, c.code, c.name;
`.trim(),
  report_class_gpa_average: `
create or replace view public.report_class_gpa_average as
select
  ac.id as academic_class_id,
  ac.code as class_code,
  ac.name as class_name,
  s.id as semester_id,
  s.name as semester_name,
  round(avg(g.gpa_value)::numeric, 2) as average_gpa4,
  round(avg(g.total_score)::numeric, 2) as average_score10
from grades g
join enrollments e on e.id = g.enrollment_id
join students st on st.id = e.student_id
join academic_classes ac on ac.id = st.academic_class_id
join course_offerings co on co.id = e.course_offering_id
join semesters s on s.id = co.semester_id
where g.status in ('APPROVED', 'LOCKED')
group by ac.id, ac.code, ac.name, s.id, s.name;
`.trim(),
  report_academic_warnings: `
create or replace view public.report_academic_warnings as
with student_rollup as (
  select
    st.id as student_id,
    st.student_code,
    p.full_name as student_name,
    ac.code as class_code,
    coalesce(sum(c.credit_hours), 0)::int as completed_credits,
    round(avg(g.gpa_value)::numeric, 2) as cumulative_gpa4,
    round(avg(g.total_score)::numeric, 2) as cumulative_score10
  from students st
  join profiles p on p.id = st.id
  left join academic_classes ac on ac.id = st.academic_class_id
  left join enrollments e on e.student_id = st.id
  left join grades g on g.enrollment_id = e.id and g.status in ('APPROVED', 'LOCKED')
  left join course_offerings co on co.id = e.course_offering_id
  left join courses c on c.id = co.course_id
  group by st.id, st.student_code, p.full_name, ac.code
)
select *
from student_rollup
where cumulative_gpa4 is not null and cumulative_gpa4 < 2.0;
`.trim(),
};

function toRoundedNumber(value: number | null | undefined) {
  return Number((value ?? 0).toFixed(2));
}

function isMissingViewError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const typed = error as { code?: string | null; message?: string | null };
  const code = typed.code ?? "";
  const message = (typed.message ?? "").toLowerCase();
  return code === "42P01" || message.includes("does not exist");
}

type SafeViewResult<T> = {
  data: T[];
  missing: boolean;
};

async function queryViewSafe<T>(
  queryFactory: () => Promise<{ data: T[] | null; error: { code?: string | null; message?: string | null } | null }>,
): Promise<SafeViewResult<T>> {
  const { data, error } = await queryFactory();
  if (!error) {
    return { data: data ?? [], missing: false };
  }

  if (isMissingViewError(error)) {
    return { data: [], missing: true };
  }

  throw new Error(error.message ?? "Unable to load report view.");
}

function buildMissingSql(missingViews: RequiredReportView[]) {
  if (!missingViews.length) {
    return "";
  }

  return missingViews.map((view) => REPORT_VIEW_SQL[view]).join("\n\n");
}

export async function getAdminReportSnapshot() {
  noStore();
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
    studentDistributionResult,
    passRatesResult,
    classGpaResult,
    warningsResult,
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
    queryViewSafe<StudentDistributionRow>(async () => {
      const result = await supabase
        .from("report_student_distribution")
        .select("*")
        .order("total_students", { ascending: false });

      return {
        data: result.data as StudentDistributionRow[] | null,
        error: result.error as { code?: string | null; message?: string | null } | null,
      };
    }),
    queryViewSafe<CoursePassRateRow>(async () => {
      const result = await supabase
        .from("report_course_pass_rate")
        .select("*")
        .order("total_completed", { ascending: false });

      return {
        data: result.data as CoursePassRateRow[] | null,
        error: result.error as { code?: string | null; message?: string | null } | null,
      };
    }),
    queryViewSafe<ClassGpaAverageRow>(async () => {
      const result = await supabase
        .from("report_class_gpa_average")
        .select("*")
        .order("average_gpa4", { ascending: false });

      return {
        data: result.data as ClassGpaAverageRow[] | null,
        error: result.error as { code?: string | null; message?: string | null } | null,
      };
    }),
    queryViewSafe<AcademicWarningRow>(async () => {
      const result = await supabase
        .from("report_academic_warnings")
        .select("*")
        .order("cumulative_gpa4", { ascending: true });

      return {
        data: result.data as AcademicWarningRow[] | null,
        error: result.error as { code?: string | null; message?: string | null } | null,
      };
    }),
  ]);

  const countErrors = [
    activeStudentsError,
    totalLecturersError,
    openOfferingsError,
    pendingRegradesError,
    submittedGradesError,
    demoRowsError,
    liveRowsError,
  ].filter(Boolean);
  if (countErrors.length > 0) {
    throw new Error(countErrors[0]?.message ?? "Unable to load admin reports.");
  }

  const missingViews = REQUIRED_REPORT_VIEWS.filter((view) => {
    if (view === "report_course_pass_rate") {
      return passRatesResult.missing;
    }

    if (view === "report_class_gpa_average") {
      return classGpaResult.missing;
    }

    return warningsResult.missing;
  });

  const departmentDistribution = Object.values(
    studentDistributionResult.data.reduce<Record<string, DepartmentDistributionPoint>>(
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

  const passRates = passRatesResult.data
    .filter((row) => (row.total_completed ?? 0) > 0)
    .map((row) => ({
      course_code: row.course_code ?? "Chưa có",
      course_name: row.course_name ?? "Chưa có",
      pass_rate: toRoundedNumber(row.pass_rate),
      total_completed: row.total_completed ?? 0,
    }))
    .slice(0, 8);

  const classGpa = classGpaResult.data
    .filter((row) => row.class_code && row.semester_name)
    .map((row) => ({
      average_gpa4: toRoundedNumber(row.average_gpa4),
      average_score10: toRoundedNumber(row.average_score10),
      class_code: row.class_code ?? "Chưa có",
      semester_name: row.semester_name ?? "Chưa có",
    }))
    .slice(0, 8);

  const warnings = warningsResult.data.map((row) => ({
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
    missingViewSql: buildMissingSql(missingViews),
    missingViews,
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
