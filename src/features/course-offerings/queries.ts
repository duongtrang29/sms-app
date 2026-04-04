import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import type { CourseOffering } from "@/types/app";

export type CourseOfferingRecord = CourseOffering & {
  lecturer_id: string | null;
};

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

export async function listCourseOfferings() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_offerings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as CourseOffering[];
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
