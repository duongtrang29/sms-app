import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types/app";

export type CourseRecord = Course & {
  prerequisite_codes: string;
};

export async function listCourses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Course[];
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
