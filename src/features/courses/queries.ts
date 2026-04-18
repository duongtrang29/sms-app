import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types/app";

const MAX_COURSE_LIST_LIMIT = 500;

export type CourseRecord = Course & {
  prerequisite_codes: string;
};

export type CourseListFilters = {
  departmentId?: string;
  limit?: number;
  query?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export type CourseListSnapshot = {
  items: Course[];
  summary: {
    activeCourses: number;
    totalCourses: number;
  };
};

function normalizeSearchQuery(query: string | undefined) {
  if (!query) {
    return "";
  }

  return query.trim().replaceAll("%", "").replaceAll(",", " ");
}

function resolveLimit(limit: number | undefined) {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return undefined;
  }

  if (limit <= 0) {
    return undefined;
  }

  return Math.min(limit, MAX_COURSE_LIST_LIMIT);
}

async function fetchCourseSummary() {
  const supabase = await createClient();
  const [
    { count: totalCoursesCount, error: totalCoursesError },
    { count: activeCoursesCount, error: activeCoursesError },
  ] = await Promise.all([
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const firstSummaryError = [totalCoursesError, activeCoursesError].find(Boolean);
  if (firstSummaryError) {
    throw new Error(firstSummaryError.message ?? "Unable to load course summary.");
  }

  return {
    activeCourses: activeCoursesCount ?? 0,
    totalCourses: totalCoursesCount ?? 0,
  };
}

async function fetchCourses(filters: CourseListFilters = {}) {
  const supabase = await createClient();
  const normalizedQuery = normalizeSearchQuery(filters.query);
  const resolvedLimit = resolveLimit(filters.limit);

  let queryBuilder = supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (filters.departmentId) {
    queryBuilder = queryBuilder.eq("department_id", filters.departmentId);
  }

  if (filters.status) {
    queryBuilder = queryBuilder.eq("is_active", filters.status === "ACTIVE");
  }

  if (normalizedQuery) {
    const escapedQuery = `%${normalizedQuery}%`;
    queryBuilder = queryBuilder.or(`code.ilike.${escapedQuery},name.ilike.${escapedQuery}`);
  }

  if (resolvedLimit) {
    queryBuilder = queryBuilder.limit(resolvedLimit);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Course[];
}

/**
 * Returns courses sorted by code with optional server-side filters.
 * @param filters optional filters applied at database level.
 * @returns courses for admin and enrollment flows.
 */
export async function listCourses(filters: CourseListFilters = {}) {
  return fetchCourses(filters);
}

/**
 * Returns filtered course list plus dashboard summary counters.
 * @param filters optional filters applied to course rows.
 * @returns snapshot used by admin courses page.
 */
export async function listCoursesSnapshot(
  filters: CourseListFilters = {},
): Promise<CourseListSnapshot> {
  const [items, summary] = await Promise.all([
    fetchCourses(filters),
    fetchCourseSummary(),
  ]);

  return {
    items,
    summary,
  };
}

export async function listCoursesByIds(ids: string[]) {
  if (!ids.length) {
    return [] as Course[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .in("id", ids as never);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Course[];
}

export async function getCourseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const { data: prerequisites, error: prerequisiteError } = await supabase
    .from("course_prerequisites")
    .select("prerequisite_course_id")
    .eq("course_id", id);

  if (prerequisiteError) {
    throw new Error(prerequisiteError.message);
  }

  const prerequisiteIds = (
    (prerequisites as Array<{ prerequisite_course_id: string }>) ?? []
  ).map((item) => item.prerequisite_course_id);

  if (!prerequisiteIds.length) {
    return {
      ...(data as Course),
      prerequisite_codes: "",
    } satisfies CourseRecord;
  }

  const { data: prerequisiteCourses, error: prerequisiteCoursesError } =
    await supabase
      .from("courses")
      .select("code")
      .in("id", prerequisiteIds as never);

  if (prerequisiteCoursesError) {
    throw new Error(prerequisiteCoursesError.message);
  }

  return {
    ...(data as Course),
    prerequisite_codes: (prerequisiteCourses as Array<{ code: string }>)
      .map((course) => course.code)
      .join(", "),
  } satisfies CourseRecord;
}
