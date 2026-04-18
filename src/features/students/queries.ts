import { createClient } from "@/lib/supabase/server";

const MAX_STUDENT_LIST_LIMIT = 500;

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
  const supabase = await createClient();
  const normalizedQuery = normalizeSearchQuery(filters.query);
  const resolvedLimit = resolveLimit(filters.limit);

  let queryBuilder = supabase
    .from("students")
    .select(STUDENT_SELECT_QUERY)
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

  if (resolvedLimit) {
    queryBuilder = queryBuilder.limit(resolvedLimit);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as StudentRow[]).map(mapStudentRow);
}

async function fetchStudentRowById(studentId: string) {
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
  return fetchStudentRows(filters);
}

/**
 * Returns filtered student records plus dashboard summary counters.
 * @param filters optional filters applied to student list rows.
 * @returns snapshot used by admin students page.
 */
export async function listStudentsSnapshot(
  filters: StudentListFilters = {},
): Promise<StudentListSnapshot> {
  const [items, summary] = await Promise.all([
    fetchStudentRows(filters),
    fetchStudentSummary(),
  ]);

  return {
    items,
    summary,
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
