import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Semester } from "@/types/app";

const listSemestersCached = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("semesters")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Semester[];
  },
  ["semesters:list"],
  {
    revalidate: 60 * 60,
    tags: ["semesters"],
  },
);

export async function listSemesters() {
  return listSemestersCached();
}

export async function listSemestersByIds(ids: string[]) {
  if (!ids.length) {
    return [] as Semester[];
  }

  const idSet = new Set(ids);
  const semesters = await listSemesters();
  return semesters.filter((semester) => idSet.has(semester.id));
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
