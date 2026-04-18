import { createClient } from "@/lib/supabase/server";
import type { Semester } from "@/types/app";

export async function listSemesters() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Semester[];
}

export async function listSemestersByIds(ids: string[]) {
  if (!ids.length) {
    return [] as Semester[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .in("id", ids as never);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Semester[];
}

export async function getSemesterById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Semester | null;
}
