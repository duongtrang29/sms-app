import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

import { requireAuth, requireRole } from "@/lib/auth/session";
import type { CourseOffering, Enrollment, Schedule } from "@/types/app";

export async function listStudentEnrollments() {
  noStore();
  const profile = await requireRole(["STUDENT"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", profile.id)
    .order("enrolled_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Enrollment[];
}

export async function listOpenOfferingsForStudent() {
  noStore();
  await requireRole(["STUDENT"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_offerings")
    .select("*")
    .eq("status", "OPEN")
    .order("registration_open_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as CourseOffering[];
}

export async function listSchedulesForOfferings(offeringIds: string[]) {
  noStore();
  if (!offeringIds.length) {
    return [] as Schedule[];
  }

  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .in("course_offering_id", offeringIds as never);

  if (error) {
    throw new Error(error.message);
  }

  return data as Schedule[];
}
