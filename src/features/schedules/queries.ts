import { createClient } from "@/lib/supabase/server";
import type { Schedule } from "@/types/app";

export async function listSchedules() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Schedule[];
}

export async function getScheduleById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Schedule | null;
}
