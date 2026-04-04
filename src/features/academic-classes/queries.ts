import { createClient } from "@/lib/supabase/server";
import type { AcademicClass } from "@/types/app";

export async function listAcademicClasses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_classes")
    .select("*")
    .order("cohort_year", { ascending: false })
    .order("code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as AcademicClass[];
}

export async function getAcademicClassById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_classes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as AcademicClass | null;
}
