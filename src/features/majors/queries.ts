import { createClient } from "@/lib/supabase/server";
import type { Major } from "@/types/app";

export async function listMajors() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("majors")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Major[];
}

export async function getMajorById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("majors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Major | null;
}
