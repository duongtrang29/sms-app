import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AcademicClass } from "@/types/app";

const listAcademicClassesCached = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("academic_classes")
      .select("*")
      .order("cohort_year", { ascending: false })
      .order("code", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as AcademicClass[];
  },
  ["academic-classes:list"],
  {
    revalidate: 60 * 60,
    tags: ["academic-classes"],
  },
);

export async function listAcademicClasses() {
  return listAcademicClassesCached();
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
