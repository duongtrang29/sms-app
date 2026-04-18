import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import type { CourseOffering } from "@/types/app";

const MAX_OFFERING_LIST_LIMIT = 500;

export type CourseOfferingRecord = CourseOffering & {
  lecturer_id: string | null;
};

export type AdminCourseOfferingFilters = {
  limit?: number;
  semesterId?: string;
  status?: CourseOffering["status"];
};

export type AdminCourseOfferingSnapshot = {
  items: CourseOffering[];
  summary: {
    closedOrFinishedOfferings: number;
    openOfferings: number;
    totalOfferings: number;
  };
};

function resolveLimit(limit: number | undefined) {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return undefined;
  }

  if (limit <= 0) {
    return undefined;
  }

  return Math.min(limit, MAX_OFFERING_LIST_LIMIT);
}

async function fetchAdminOfferingSummary() {
  const supabase = await createClient();
  const [
    { count: totalOfferingsCount, error: totalOfferingsError },
    { count: openOfferingsCount, error: openOfferingsError },
    { count: closedOrFinishedCount, error: closedOrFinishedError },
  ] = await Promise.all([
    supabase
      .from("course_offerings")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("course_offerings")
      .select("id", { count: "exact", head: true })
      .eq("status", "OPEN"),
    supabase
      .from("course_offerings")
      .select("id", { count: "exact", head: true })
      .in("status", ["CLOSED", "FINISHED"] as never),
  ]);

  const firstSummaryError = [
    totalOfferingsError,
    openOfferingsError,
    closedOrFinishedError,
  ].find(Boolean);
  if (firstSummaryError) {
    throw new Error(firstSummaryError.message ?? "Unable to load offering summary.");
  }

  return {
    closedOrFinishedOfferings: closedOrFinishedCount ?? 0,
    openOfferings: openOfferingsCount ?? 0,
    totalOfferings: totalOfferingsCount ?? 0,
  };
}

async function fetchCourseOfferings(filters: AdminCourseOfferingFilters = {}) {
  const supabase = await createClient();
  const resolvedLimit = resolveLimit(filters.limit);

  let queryBuilder = supabase
    .from("course_offerings")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.semesterId) {
    queryBuilder = queryBuilder.eq("semester_id", filters.semesterId);
  }

  if (filters.status) {
    queryBuilder = queryBuilder.eq("status", filters.status);
  }

  if (resolvedLimit) {
    queryBuilder = queryBuilder.limit(resolvedLimit);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseOffering[];
}

export async function listPrimaryTeachingAssignments() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_assignments")
    .select("course_offering_id, lecturer_id")
    .eq("is_primary", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Array<{ course_offering_id: string; lecturer_id: string }>) ?? [];
}

export async function listPrimaryTeachingAssignmentsForOfferings(
  offeringIds: string[],
) {
  if (!offeringIds.length) {
    return [] as Array<{ course_offering_id: string; lecturer_id: string }>;
  }

  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_assignments")
    .select("course_offering_id, lecturer_id")
    .eq("is_primary", true)
    .in("course_offering_id", offeringIds as never);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Array<{ course_offering_id: string; lecturer_id: string }>) ?? [];
}

export async function listCourseOfferings(
  filters: AdminCourseOfferingFilters = {},
) {
  await requireAuth();
  return fetchCourseOfferings(filters);
}

export async function listAdminCourseOfferingSnapshot(
  filters: AdminCourseOfferingFilters = {},
): Promise<AdminCourseOfferingSnapshot> {
  await requireAuth();
  const [items, summary] = await Promise.all([
    fetchCourseOfferings(filters),
    fetchAdminOfferingSummary(),
  ]);

  return {
    items,
    summary,
  };
}

export async function listCourseOfferingsByIds(ids: string[]) {
  if (!ids.length) {
    return [] as CourseOffering[];
  }

  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_offerings")
    .select("*")
    .in("id", ids as never);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseOffering[];
}

export async function getCourseOfferingById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_offerings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const { data: teachingAssignments, error: assignmentError } = await supabase
    .from("teaching_assignments")
    .select("lecturer_id")
    .eq("course_offering_id", id)
    .eq("is_primary", true)
    .limit(1);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const primaryAssignment = (
    (teachingAssignments as Array<{ lecturer_id: string }>) ?? []
  )[0];

  return {
    ...(data as CourseOffering),
    lecturer_id: primaryAssignment?.lecturer_id ?? null,
  } satisfies CourseOfferingRecord;
}
