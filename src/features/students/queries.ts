import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const MAX_STUDENT_LIST_LIMIT = 500;
const DEFAULT_STUDENT_PAGE_SIZE = 20;
const MAX_STUDENT_PAGE_SIZE = 100;

const STUDENT_SELECT_QUERY = `
  id,
  student_code,
  academic_class_id,
  enrollment_year,
  current_status,
  gender,
  date_of_birth,
  address,
  emergency_contact,
  profiles:profiles!inner(
    email,
    full_name,
    phone,
    status
  )
`;

export type StudentRecord = {
  academic_class_id: string;
  access_status: "ACTIVE" | "INACTIVE" | "LOCKED";
  address: string | null;
  current_status: "ACTIVE" | "SUSPENDED" | "GRADUATED" | "DROPPED";
  date_of_birth: string | null;
  email: string;
  emergency_contact: string | null;
  enrollment_year: number;
  full_name: string;
  gender: string | null;
  id: string;
  phone: string | null;
  student_code: string;
};

export type StudentListFilters = {
  academicClassId?: string;
  accessStatus?: StudentRecord["access_status"];
  currentStatus?: StudentRecord["current_status"];
  limit?: number;
  page?: number;
  pageSize?: number;
  query?: string;
};

export type StudentListSnapshot = {
  items: StudentRecord[];
  summary: {
    activeAcademic: number;
    activeAccess: number;
    totalStudents: number;
  };
};

export type StudentListPagedSnapshot = StudentListSnapshot & {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

type StudentRow = {
  academic_class_id: string;
  address: string | null;
  current_status: "ACTIVE" | "SUSPENDED" | "GRADUATED" | "DROPPED";
  date_of_birth: string | null;
  emergency_contact: string | null;
  enrollment_year: number;
  gender: string | null;
  id: string;
  profiles:
    | {
        email: string;
        full_name: string;
        phone: string | null;
        status: "ACTIVE" | "INACTIVE" | "LOCKED";
      }
    | Array<{
        email: string;
        full_name: string;
        phone: string | null;
        status: "ACTIVE" | "INACTIVE" | "LOCKED";
      }>;
  student_code: string;
};

function normalizeRelation<T>(
  relation: T | T[] | null | undefined,
): T | undefined {
  if (Array.isArray(relation)) {
    return relation[0];
  }

  return relation ?? undefined;
}

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

  return Math.min(limit, MAX_STUDENT_LIST_LIMIT);
}

function resolvePage(page: number | undefined) {
  if (typeof page !== "number" || Number.isNaN(page)) {
    return 1;
  }

  return Math.max(1, Math.floor(page));
}

function resolvePageSize(pageSize: number | undefined) {
  if (typeof pageSize !== "number" || Number.isNaN(pageSize)) {
    return DEFAULT_STUDENT_PAGE_SIZE;
  }

  if (pageSize <= 0) {
    return DEFAULT_STUDENT_PAGE_SIZE;
  }

  return Math.min(Math.floor(pageSize), MAX_STUDENT_PAGE_SIZE);
}

function mapStudentRow(row: StudentRow): StudentRecord {
  const profile = normalizeRelation(row.profiles);
  if (!profile) {
    throw new Error("Student profile relation is missing.");
  }

  return {
    academic_class_id: row.academic_class_id,
    access_status: profile.status,
    address: row.address,
    current_status: row.current_status,
    date_of_birth: row.date_of_birth,
    email: profile.email,
    emergency_contact: row.emergency_contact,
    enrollment_year: row.enrollment_year,
    full_name: profile.full_name,
    gender: row.gender,
    id: row.id,
    phone: profile.phone,
    student_code: row.student_code,
  };
}

async function fetchStudentSummary() {
  noStore();
  const supabase = await createClient();
  const [
    { count: totalStudentsCount, error: totalStudentsError },
    { count: activeAccessCount, error: activeAccessError },
    { count: activeAcademicCount, error: activeAcademicError },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase
      .from("students")
      .select("id, profiles!inner(id)", { count: "exact", head: true })
      .eq("profiles.status", "ACTIVE"),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("current_status", "ACTIVE"),
  ]);

  const firstSummaryError = [
    totalStudentsError,
    activeAccessError,
    activeAcademicError,
  ].find(Boolean);
  if (firstSummaryError) {
    throw new Error(firstSummaryError.message ?? "Unable to load student summary.");
  }

  return {
    activeAcademic: activeAcademicCount ?? 0,
    activeAccess: activeAccessCount ?? 0,
    totalStudents: totalStudentsCount ?? 0,
  };
}

async function fetchStudentRows(filters: StudentListFilters = {}) {
  noStore();
  const supabase = await createClient();
  const normalizedQuery = normalizeSearchQuery(filters.query);
  const resolvedLimit = resolveLimit(filters.limit);
  const hasPagination =
    typeof filters.page === "number" || typeof filters.pageSize === "number";
  const page = resolvePage(filters.page);
  const pageSize = resolvePageSize(filters.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabase
    .from("students")
    .select(STUDENT_SELECT_QUERY, hasPagination ? { count: "exact" } : undefined)
    .order("student_code", { ascending: true });

  if (filters.academicClassId) {
    queryBuilder = queryBuilder.eq("academic_class_id", filters.academicClassId);
  }

  if (filters.currentStatus) {
    queryBuilder = queryBuilder.eq("current_status", filters.currentStatus);
  }

  if (filters.accessStatus) {
    queryBuilder = queryBuilder.eq("profiles.status", filters.accessStatus);
  }

  if (normalizedQuery) {
    const escapedQuery = `%${normalizedQuery}%`;
    queryBuilder = queryBuilder.or(
      `student_code.ilike.${escapedQuery},profiles.full_name.ilike.${escapedQuery},profiles.email.ilike.${escapedQuery}`,
    );
  }

  if (hasPagination) {
    queryBuilder = queryBuilder.range(from, to);
  } else if (resolvedLimit) {
    queryBuilder = queryBuilder.limit(resolvedLimit);
  }

  const { count, data, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  const items = ((data ?? []) as StudentRow[]).map(mapStudentRow);

  return {
    items,
    total: hasPagination ? count ?? 0 : items.length,
  };
}

async function fetchStudentRowById(studentId: string) {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_SELECT_QUERY)
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapStudentRow(data as StudentRow);
}

/**
 * Returns student records sorted by student code with optional server-side filters.
 * @param filters optional filters applied at database level.
 * @returns student records used by admin and reporting views.
 */
export async function listStudents(
  filters: StudentListFilters = {},
): Promise<StudentRecord[]> {
  const { items } = await fetchStudentRows(filters);
  return items;
}

/**
 * Returns filtered student records plus dashboard summary counters.
 * @param filters optional filters applied to student list rows.
 * @returns snapshot used by admin students page.
 */
export async function listStudentsSnapshot(
  filters: StudentListFilters = {},
): Promise<StudentListSnapshot> {
  const [{ items }, summary] = await Promise.all([
    fetchStudentRows(filters),
    fetchStudentSummary(),
  ]);

  return {
    items,
    summary,
  };
}

/**
 * Returns paged student records plus dashboard summary counters.
 * @param filters optional filters applied to student list rows.
 * @returns paged snapshot used by admin students page.
 */
export async function listStudentsSnapshotPaged(
  filters: StudentListFilters = {},
): Promise<StudentListPagedSnapshot> {
  const page = resolvePage(filters.page);
  const pageSize = resolvePageSize(filters.pageSize);

  const [{ items, total }, summary] = await Promise.all([
    fetchStudentRows({ ...filters, page, pageSize }),
    fetchStudentSummary(),
  ]);

  return {
    items,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    pageSize,
    summary,
    total,
  };
}

/**
 * Returns one student record by profile id.
 * @param id student profile id.
 * @returns student record when found, otherwise null.
 */
export async function getStudentById(id: string): Promise<StudentRecord | null> {
  return fetchStudentRowById(id);
}
